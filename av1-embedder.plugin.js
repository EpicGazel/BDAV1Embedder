/**
 * @name AV1 Embedder
 * @version 0.0.3
 * @description Adds a replace button to convert Discord CDN links to embeddable format and resend the converted link.
 * @author Gazel
 * @source https://github.com/EpicGazel/BDAV1Embedder/blob/main/av1-embedder.plugin.js
 * @updateUrl https://raw.githubusercontent.com/EpicGazel/BDAV1Embedder/main/av1-embedder.plugin.js
 * @website https://github.com/EpicGazel/BDAV1Embedder
 * @donate https://ko-fi.com/gazel
 */

const Api = new BdApi("AV1 Embedder");
const getModule = Api.Webpack.getModule;

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
            if (link.href.includes('cdn.discordapp.com') && (link.href.includes('.mp4') || link.href.includes('.webm'))) {
                const convertedLink = this.convertCDNLink(link.href);
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
