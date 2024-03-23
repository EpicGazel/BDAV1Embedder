/**
 * @name AV1 Embedder
 * @version 0.0.4
 * @description Adds a replace button to convert Discord CDN links to embeddable format and resend the converted link.
 * @author Gazel
 * @source https://github.com/EpicGazel/BDAV1Embedder/blob/main/av1-embedder.plugin.js
 * @updateUrl https://raw.githubusercontent.com/EpicGazel/BDAV1Embedder/main/av1-embedder.plugin.js
 * @website https://github.com/EpicGazel/BDAV1Embedder
 * @donate https://ko-fi.com/gazel
 */

const Api = new BdApi("AV1 Embedder");
const getModule = Api.Webpack.getModule;

// const config = {
//     defaultConfig: [ 
//     {
//         type: 'switch',
//         name: 'Enable AV1 Embedder',
//         id: 'av1EmbedderEnabled',
//         value: true
//     },
//     {
//         type: 'switch',
//         name: 'Enable AVIF Embedder',
//         id: 'avifEmbedderEnabled',
//         value: false
//     },
//     {
//         type: 'text',
//         name: 'AV1 Converter URL',
//         id: 'av1ConverterURL',
//         value: '',
//     }
//     ]
// };

const mySettings = {
    av1EmbedderEnabled: true,
    avifEmbedderEnabled: false,
    av1ConverterURL: '',
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

module.exports = () => ({
    // constructor() {
    //     this._config = config;
    // },
    start() {
        this.observer = new MutationObserver(this.checkAndConvertLinks.bind(this));
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.checkAndConvertLinks(); // Convert links on initial load
    },
    stop() {
        this.observer.disconnect();
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
            } else if (mySettings.avifEmbbedderEnabled && !link.href.includes(mySettings.avifConverterURL) && link.href.includes('.avif')) {
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
