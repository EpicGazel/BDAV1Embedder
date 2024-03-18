/**
 * @name AV1 Embedder
 * @version 0.0.1
 * @description Converts Discord CDN links to embeddable format automatically and provides an option to resend the converted link.
 * @author Gazel
 */
 
 const config = {
	"info": {
		"name": "AV1 Embedder",
		"version": "0.0.1",
		"description": "EmbedsAv1s uploaded to discord directely.",
		"source": "https://github.com/EpicGazel/BDAV1Embedder/blob/main/av1-embedder.plugin.js",
		"github": "https://github.com/EpicGazel/BDAV1Embedder",
		"authors": [{
			"name": "Gazel"
		}]
	},
	"settings": {
		"Setting": false,
	}
}

const Api = new BdApi(config.info.name);
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
        return link.replace('.com', '.xyz')
                   .replace('attachments', 'player')
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
