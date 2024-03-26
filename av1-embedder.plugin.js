/**
 * @name AV1&Avif Embedder
 * @version 0.1.0
 * @description Adds a replace button to convert Discord CDN links to embeddable format and resend the converted link. Automatically convert AVIF to WebP on upload.
 * @author Gazel
 * @source https://github.com/EpicGazel/BDAV1Embedder/blob/main/av1-embedder.plugin.js
 * @updateUrl https://raw.githubusercontent.com/EpicGazel/BDAV1Embedder/main/av1-embedder.plugin.js
 * @website https://github.com/EpicGazel/BDAV1Embedder
 * @donate https://ko-fi.com/gazel
 */

const Api = new BdApi("AV1&Avif Embedder");
const getModule = Api.Webpack.getModule;


const mySettings = {
    av1EmbedderEnabled: true,
    avifEmbedderEnabled: false,
    avifConverterURL: '',
    convertAvifToWebp: true,
    webpQuality: 0.9
}

const insertText = (() => {
    let ComponentDispatch;
    return content => {
        if (!ComponentDispatch) ComponentDispatch = getModule(m => m.dispatchToLastSubscribed && m.emitter.listeners("INSERT_TEXT").length, { searchExports: true });
        setTimeout(() => {
            ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {
                plainText: content
            });
        });
    };
})();

module.exports = (Plugin, Library) => ({
    async start() {
        this.observer = new MutationObserver(this.checkAndConvertLinks.bind(this));
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.checkAndConvertLinks(); // Convert links on initial load

        // Patching the addFiles method of MessageAttachmentManager
        const {byProps} = Api.Webpack.Filters;
        const MessageAttachmentManager = Api.Webpack.getModule(byProps("addFiles"));

        // Blob to File Conversion 
        // async function convertAVIFtoWebP(avifFile) {
        //     console.log('Converting AVIF to WebP Function...');
        //     try {
        //         const avifBlob = new Blob([await avifFile.file.arrayBuffer()], { type: 'image/avif' });
        //         const canvas = document.createElement('canvas');
        //         const ctx = canvas.getContext('2d');
        
        //         const webpFile = await new Promise((resolve, reject) => {
        //             const img = new Image();
        //             img.onload = function () {
        //                 canvas.width = img.width;
        //                 canvas.height = img.height;
        //                 ctx.drawImage(img, 0, 0);
        
        //                 canvas.toBlob(function (webpBlob) {
        //                     if (webpBlob) {
        //                         const file = new File([webpBlob], avifFile.file.name.replace('.avif', '.webp'), { type: 'image/webp' });
        //                         const webpFile = {
        //                             file: file,
        //                             isThumbnail: avifFile.isThumbnail,
        //                             platform: avifFile.platform
        //                         };
        //                         resolve(webpFile);
        //                     } else {
        //                         reject(new Error('Failed to create WebP blob'));
        //                     }
        //                 }, 'image/webp');
        //             };
        //             img.src = URL.createObjectURL(avifBlob);
        //         });
        
        //         console.log(`webpFile:`, webpFile);
        //         return webpFile;
        //     } catch (error) {
        //         console.error('Error converting AVIF to WebP:', error);
        //         return avifFile; // Return the original file in case of an error
        //     }
        // }

        // Return early if WebP conversion is disabled
        if (!mySettings.convertAvifToWebp) return;

        async function convertAVIFtoWebP(avifFile) {
            console.log('Converting AVIF to WebP Function...');
            try {
                const avifBlob = new Blob([await avifFile.file.arrayBuffer()], { type: 'image/avif' });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
        
                const webpBlob = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = function () {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
        
                        const dataURL = canvas.toDataURL('image/webp', mySettings.webpQuality);
                        const base64 = dataURL.split(',')[1];
                        const webpBlob = b64toBlob(base64, 'image/webp');
                        resolve(webpBlob);
                    };
                    img.src = URL.createObjectURL(avifBlob);
                });
        
                const file = new File([webpBlob], avifFile.file.name.replace('.avif', '.webp'), { type: 'image/webp' });
                const webpFile = {
                    file: file,
                    isThumbnail: avifFile.isThumbnail,
                    platform: avifFile.platform
                };
                console.log('webpFile:', webpFile);
                return webpFile;
            } catch (error) {
                console.error('Error converting AVIF to WebP:', error);
                return avifFile; // Return the original file in case of an error
            }
        }
        
        // Helper function to convert base64 to Blob
        function b64toBlob(base64, type = 'application/octet-stream') {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: type });
        }

        // Patching the addFiles method to include AVIF conversion
        Api.Patcher.instead(MessageAttachmentManager, "addFiles", (_, [{files, channelId}], original) => {
            console.log("Adding and converting files...");

            for (const file of files) {
                console.log(`File: ${file.file.name} (${file.file.type})`);
            }
            const convertedFilesPromises = files.map(async (file) => {
            if (file.file.type === 'image/avif') {
                // Convert AVIF to WebP format
                console.log("Converting AVIF to WebP...");
                try {
                    const convertedFile = await convertAVIFtoWebP(file);
                    return convertedFile;
                } catch (error) {
                    console.error("Error converting AVIF to WebP:", error);
                    return file;
                }
            } else {
                console.log("Skipping non-AVIF file...");
                return file;
            }
            });

            // Wait for all conversion promises to resolve
            Promise.all(convertedFilesPromises).then((convertedFiles) => {
                // Call the original method with the modified files
                original({
                    files: convertedFiles,
                    channelId: channelId,
                    showLargeMessageDialog: false,
                    draftType: 0
                });
            }).catch((error) => {
                console.error("Error converting AVIF to WebP:", error);
                // Call the original method with the original files in case of error
                original({
                    files: files,
                    channelId: channelId,
                    showLargeMessageDialog: false,
                    draftType: 0
                });
            });
        });
    },
    stop() {
        this.observer.disconnect();
        Api.Patcher.unpatchAll();
    },
    checkAndConvertLinks() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if (mySettings.av1EmbedderEnabled && link.href.includes('cdn.discordapp.com') && (link.href.includes('.mp4') || link.href.includes('.webm'))) {
                console.log(`Converting av1 link ${link.href}`);
                const convertedLink = this.convertCDNLink(link.href);
                if (convertedLink !== link.href) {
                    link.href = convertedLink;
                    const resendButton = this.createResendButton(convertedLink);
                    link.parentElement.appendChild(resendButton);
                }
            } else if (mySettings.avifEmbedderEnabled && !link.href.includes(mySettings.avifConverterURL) && link.href.includes('.avif')) {
                console.log(`Converting avif link ${link.href}`);
                const convertedLink = this.convertAVIFLink(link.href);
                if (convertedLink !== link.href) {
                    link.href = convertedLink;
                    const resendButton = this.createResendButton(convertedLink);
                    link.parentElement.appendChild(resendButton);
                }
            }
        });
    },
    convertCDNLink(link) {
        // Convert .com to .xyz, attachments to player, remove tracking parameters, and trailing "&" after .mp4 or .webm
        return "https://embeds.video/" + link.replace('.com', '.xyz')
                   .replace('attachments', 'plzproxy')
                   .replace(/[\?&](ex|is|hm)=[^&]+/g, '')
                   .replace(/\.mp4(&|$)/, '.mp4')
                   .replace(/\.webm(&|$)/, '.webm');
    },
    convertAVIFLink(link) {
        return mySettings.avifConverterURL + link;
    },
    createResendButton(link) {
        const button = document.createElement('button');
        button.textContent = 'Resend';
        button.style.marginLeft = '5px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            // Insert the converted link into the message box
            insertText(link);
        });
        return button;
	},
    observer: null
});
