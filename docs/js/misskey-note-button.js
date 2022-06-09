class MisskeyNoteButton extends HTMLElement {
    //constructor(domain) {
    constructor() {
        super();
        this.domain = null
        this.text = ''
        this.imgSrc = null
        this.imgSize = '64'
        this.title = 'ノートする'
        this.okMsg = 'ノートしました！'
        this.ngMsg = 'キャンセルしました。'
    }
    static get observedAttributes() {
        return ['domain', 'text', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
    }
    async connectedCallback() {
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const button = await this.#make()
        console.debug(button.innerHTML)
        //shadow.innerHTML = `<style>${this.#cssBase()}${this.#cssAnimation()}</style>${button.innerHTML}` 
        
        shadow.innerHTML = `<style>${this.#cssBase()}${this.#cssButton()}${this.#cssAnimation()}${this.#cssFocsAnimation()}</style>${button.outerHTML}` 
        // pointer系 = mouse系 + touch系 + pen系
        //this.shadowRoot.querySelector('img').addEventListener('pointerdown', (e)=>{ e.target.classList.add('jump'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('pointerover', (e)=>{ e.target.classList.add('flip'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('mouseover', (e)=>{ e.target.classList.add('flip'); }, false);
        this.shadowRoot.querySelector('img').addEventListener('animationend', (e)=>{ e.target.classList.remove('jump'); e.target.classList.remove('flip'); }, false);
        this.#addListenerEvent()
        this.#redirectCallback()
    }
    #cssBase() { return `img{cursor:pointer; text-align:center; vertical-align:middle; user-select:none;}` }
    #cssButton() { return `
button {
    width: auto;
    padding: 0;
    margin: 0;
    background: none;
    border: 0;
    font-size: 0;
    line-height: 0;
    overflow: visible;
    cursor: pointer;
}`
}
    #cssAnimation() { return `
@keyframes jump {
  from {
    position:relative;
    bottom:0;
    transform: rotateY(0);
  }
  45% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  55% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  to {
    position:relative;
    bottom: 0;
    transform: rotateY(720deg);
  }
}
.jump {
  transform-origin: 50% 50%;
  animation: jump .5s linear alternate;
}
@keyframes flip {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(180deg);
  }
}
.flip {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}`; }
    #cssFocsAnimation() { return `
button {
  width: ${this.imgSize}px;
  height: ${this.imgSize}px;
}
/* アニメが完了するまでクリックできなくなる
button:focus {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}
*/
button, button img {
  width: ${this.imgSize}px;
  height: ${this.imgSize}px;
  z-index: 1;
}
button:focus, button:focus img {
  width: ${this.imgSize * 1.5}px;
  height: ${this.imgSize * 1.5}px;
  z-index: 9999;
  vertical-align:bottom;
}
`
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        if ('img-src' === property) { this.imgSrc = newValue}
        else if ('img-size' === property) { this.imgSize = newValue}
        else if ('ok-msg' === property) { this.okMsg = newValue}
        else if ('ng-msg' === property) { this.ngMsg = newValue}
        else { this[property] = newValue; }
    }
    async #redirectCallback() { // 認証したあとに戻ってきたらノートする
        const url = new URL(location.href)
        console.debug('----- #redirectCallback() -----')
        console.debug(url, url.href)
        //console.debug(url.searchParams.has('token'), url.searchParams.has('domain'))
        console.debug(url.searchParams.has('token'), sessionStorage.getItem(`misskey-domain`))
        // マストドンAPI oauth/authorize でリダイレクトされた場合（認証を拒否した場合）
        if(url.searchParams.has('error')) {
            console.debug(this.domain, url.searchParams.get('domain'))
            if (this.domain === url.searchParams.get('domain')) {
                console.debug((url.searchParams.has('error_description')) ? decodeURI(url.searchParams.get('error_description')) : '認証エラーです。')
                //alert((url.searchParams.has('error_description')) ? decodeURI(url.searchParams.get('error_description')) : '認証エラーです。')
                //this.#toast((url.searchParams.has('error_description')) ? decodeURI(url.searchParams.get('error_description')) : '認証エラーです。', true)
                this.#toast('キャンセルしました')
                const params = url.searchParams;
                params.delete('error');
                params.delete('error_description');
                history.replaceState('', '', url.pathname);
            }
        }

        // misskey API auth/session/generate でリダイレクトされた場合（認証に成功した場合）
        //else if (url.searchParams.has('token') && url.searchParams.has('domain')) {
        else if (url.searchParams.has('token')) {
            console.debug('------------- 認証に成功した（リダイレクトされた） -------------')
            //const domain = url.searchParams.get('domain') // mstdn.jp, pawoo.net, ...
            const domain = sessionStorage.getItem(`misskey-domain`);
            const client = new MisskeyNoteClient(domain)
            const token = url.searchParams.get('token')
            sessionStorage.setItem(`${domain}-token`, token)
            // 認証コード(token)をURLパラメータから削除する
            const params = url.searchParams;
            params.delete('token');
            history.replaceState('', '', url.pathname);
            // トークンを取得して有効であることを確認しノートする
            const text = sessionStorage.getItem(`misskey-note-text`)
            console.debug('----- authorized -----')
            console.debug('id:', sessionStorage.getItem(`${domain}-id`))
            console.debug('secret:', sessionStorage.getItem(`${domain}-secret`))
            console.debug('token:', token)
            // client_id, client_secretはsessionStorageに保存しておく必要がある
            const json = await client.getToken(sessionStorage.getItem(`${domain}-secret`), token)
            this.#errorApi(json)
            console.debug('accessToken:', json.accessToken)
            sessionStorage.setItem(`${domain}-accessToken`, json.accessToken);
            const accessToken = json.accessToken
            /*
            const v = await client.verify(accessToken)
            console.debug(v)
            this.#errorApi(v)
            */
            const i = await client.getI(json.accessToken, sessionStorage.getItem(`${domain}-secret`))
            const res = await client.note(i, text)
            this.#errorApi(res)
            this.#requestWebmention(res)
            sessionStorage.removeItem(`text`)
            //this.classList.remove('jump');
            //this.classList.remove('flip');
            this.#noteEvent(res)
            console.debug('----- 以上 -----')
        }
    }
    #errorApi(json) {
        console.debug(json)
        if (json.hasOwnProperty('error')) {
            this.#toast(json.error, true)
            //sessionStorage.removeItem(`${domain}-app`, JSON.stringify(app));
            sessionStorage.removeItem(`${domain}-id`, app.client_id);
            sessionStorage.removeItem(`${domain}-secret`, app.client_secret);
            //sessionStorage.removeItem(`text`);
            sessionStorage.removeItem(`${domain}-accessToken`, json.accessToken);
            throw new Error(`マストドンAPIでエラーがありました。詳細はデバッグログやsessionStorageを参照してください。: ${JSON.stringify(json)}`)
        }
    }
    #noteEvent(json) { 
        const params = {
            domain: this.domain,
            json: json,
        }
        this.dispatchEvent(new CustomEvent('note', {detail: params}));
    }
    async #make() {
        const button = await this.#makeSendButton()
        const img = this.#makeSendButtonImg()
        button.appendChild(img)
        return button
        /*
        const a = await this.#makeSendButtonA()
        const img = this.#makeSendButtonImg()
        a.appendChild(img)
        return a
        */
    }
    #makeSendButtonA() {
        const a = document.createElement('a')
        a.setAttribute('title', this.title)
        a.setAttribute('class', `vov swivel-horizontal-double`) // アニメーション用
        return a
    }
    #makeSendButton() {
        const button = document.createElement('button')
        //a.setAttribute('title', this.title)
        button.setAttribute('title', (this.domain) ? `${this.domain}へノートする` : `任意のインスタンスへノートする`)
        return button
    }
    #makeSendButtonImg() {
        const img = document.createElement('img')
        const size = this.#parseImgSize()
        const [width, height] = this.#parseImgSize()
        img.setAttribute('width', `${width}`)
        img.setAttribute('height', `${height}`)
        img.setAttribute('src', `${this.#getImgSrc()}`)
        //img.classList.add('flip'); // 初回アニメーション用
        return img
    }
    #getImgWidth() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[0] : this.imgSize) }
    #getImgHeight() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[1] : this.imgSize) }
    #parseImgSize() {
        if (0 <= this.imgSize.indexOf('x')) { return this.imgSize.split('x').map(v=>(parseInt(v)) ? parseInt(v) : 64) }
        else { return (parseInt(this.imgSize)) ? [parseInt(this.imgSize), parseInt(this.imgSize)] : [64, 64] }
    }
    #getImgSrc() {
        console.debug(this.domain, this.imgSize)
        if (this.imgSrc) { return this.imgSrc }
        //return `http://www.google.com/s2/favicons?domain=${this.domain}`
        if (this.domain) { return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${this.domain}&size=${this.imgSize}` }
        return `./asset/image/mastodon_mascot.svg`
        /*
        if (this.imgSrc) { return this.imgSrc }
        if (this.img) {
            const num = parseInt(this.img)
            if (isNaN(num)) {
                const key = this.icon.getKey(this.img, this.imgSize)
                return (this.icon.Base64.has(key)) ? this.icon.Base64.get(key) : this.icon.Default }
            else {
                if (this.icon.Base64.size <= num) { return this.icon.Default }
                if (num < this.icon.Base64.size) { return [...this.icon.Base64.values()][num] }
                return this.icon.get(this.img, this.imgSize)
            }
        }
        return this.icon.Default
        */
    }
    #addListenerEvent() { // ノートボタンを押したときの動作を実装する
        //this.addEventListener('pointerdown', async(event) => {
        this.addEventListener('click', async(event) => { console.debug('click toot-button'); await this.#note(event.target) });
        // clickとあわせて２回発行されてしまう！　もうスマホ側は知らん。
        //this.addEventListener('pointerdown', async(event) => { console.debug('pointer-down toot-button'); this.dispatchEvent(new Event('click')) });
        //this.addEventListener('pointerdown', async(event) => { this.#note() });
    }
    #getText() {
        if (this.text) { return this.text }
        // toot-dialogのtoot-text要素から取得しようと思ったが、shadow要素のためか取得できなかった。
    }
    #getDomain() {
        const domain = window.prompt('インスタンスのURLかドメイン名を入力してください。');
        try { return new URL(domain).hostname }
        catch (e) { return domain }
    }
    #isExistInstance() {
        // 入力したドメインが存在するか（リンク切れでないか）
        // 入力したドメインはマストドンのインスタンスか（どうやってそれを判定するか）
        return true
    }
    async #note(target) {
        console.debug('ノートボタンを押しました。')
        const text = this.#getText()
        console.debug(text)
        if (!text || 0 === text.trim().length) {
            this.#toast('ノート内容を入れてください。', true)
            return
        }
        //event.target.classList.add('jump');
        target.classList.add('jump');
        const domain = (this.domain) ? this.domain : this.#getDomain()
        this.domain = domain
        console.debug(domain)
        const client = new MisskeyNoteClient(domain)
        const accessToken = sessionStorage.getItem(`${domain}-accessToken`)
        //if (accessToken && client.verify(accessToken)) {
        if (accessToken) {
            console.debug('既存のトークンが有効なため即座にノートします。');
            //const res = await client.toot(accessToken, this.text)
            const res = await client.note(accessToken, this.#getText())
            this.#errorApi(res)
            this.#requestWebmention(res)
            //event.target.classList.remove('jump');
            //event.target.classList.remove('flip');
            this.#noteEvent(res)
        } else {
            console.debug('既存のトークンがないか無効のため、新しいアクセストークンを発行します。');
            const app = await client.createApp().catch(e=>alert(e))
            this.#errorApi(app)
            //console.debug(app.client_id)
            //console.debug(app.client_secret)
            //console.debug(sessionStorage.getItem(`${domain}-id`))
            //console.debug(sessionStorage.getItem(`${domain}-name`))
            //console.debug(sessionStorage.getItem(`${domain}-secret`))
            sessionStorage.setItem(`${domain}-app`, JSON.stringify(app));
            sessionStorage.setItem(`${domain}-id`, app.id);
            sessionStorage.setItem(`${domain}-secret`, app.secret);
            //const text = document.getElementById('text')
            //sessionStorage.setItem(`text`, (text.hasAttribute('contenteditable')) ? text.innerText : text.value);
            //sessionStorage.setItem(`text`, this.text);
            sessionStorage.setItem(`misskey-domain`, this.domain);
            sessionStorage.setItem(`misskey-note-text`, this.#getText());
            client.authorize(app.secret)
        }
    }
    async #requestWebmention(json) { // json: toot応答
        const url = 'https://webmention.io/aaronpk/webmention'
        const params = new URLSearchParams();
        params.set('source', json.url) // ノートのURL。https://pawoo.net/web/textes/108412336135014487 など
        params.set('target', location.href) // コメントを表示するサイトのURL。https://ytyaru.github.io/ など
        const body = params.toString()
        const datas = {
            method: 'POST',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            body: body,
        }
        console.debug(url)
        console.debug(params)
        console.debug(datas)
        const res = await fetch(url, datas)
        console.debug(res)
        const j = await res.json()
        console.debug(j)
        return j
    }
    #toast(message, error=false) {
        console.debug(message)
        const options = {
            text: message, 
            position:'center'
        }
        if (error) { options.style = { background: "red" } }
        if (Toastify) { Toastify(options).showToast(); }
        else { alert(message) }
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('misskey-note-button', MisskeyNoteButton);
});

