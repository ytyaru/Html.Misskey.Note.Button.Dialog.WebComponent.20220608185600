// https://misskey.m544.net/docs/ja-JP/api
// 12.39.1以降の認証はOAuthでなくMiAuthという独自手法を使うらしい。互換性皆無。
class MisskeyNoteClientV12 { // https://forum.misskey.io/d/6-miauth
    constructor(domain='misskey.io') {
        const url = new URL(location.href)
        url.searchParams.delete('code');
        this.callbackUrl = url.href
        this.domain = domain
        //this.scope = 'read write follow push'
        //this.scope = 'write:statuses'
        //this.permission = ['write:notes'] // https://misskey.m544.net/api-doc/#section/Permissions
        this.permission = 'write:notes' // カンマ区切り。https://misskey.m544.net/api-doc/#section/Permissions
    }
    getDefaultJsonHeaders() { return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }}
    getJsonHeaders(headers=null) { return (headers) ? {...this.getDefaultJsonHeaders(), ...headers} : this.getDefaultJsonHeaders() }
    async get(endpoint, headers) {
        const url = `https://${this.domain}/api/${endpoint}`
        const data = {
            method: 'GET',
            headers: this.getJsonHeaders(headers)
        }
        console.debug(url)
        console.debug(data)
        const res = await fetch(url, data)
        console.debug(res)
        const json = await res.json()
        console.debug(json)
        console.debug(JSON.stringify(json))
        return json
    }
    async post(endpoint, headers, params) {
        const method = "POST";
        const body = JSON.stringify(params);
        const url = `https://${this.domain}/api/${endpoint}`
        console.debug(url)
        const data = {}
        data.method = method
        data.headers = this.getJsonHeaders(headers)
        if (params) { data.body = body }
        console.debug(params)
        console.debug(data)
        const res = await fetch(url, data)
        console.debug(res)
        const json = await res.json()
        console.debug(json)
        console.debug(JSON.stringify(json))
        return json
    }
    async authorize() {
        console.debug('----- misskey v12 authorize -----')
        sessionStorage.setItem(`misskey-domain`, this.domain)
        const session = UUIDv4.generate()
        sessionStorage.setItem(`misskey-${this.domain}-session`, session)
        const endpoint = `https://${this.domain}/miauth/${session}`
        const params = {
            name: `note requester`,
            permission: `write:notes`, // カンマ区切り
            callbackUrl: this.callbackUrl,
            //callbackUrl: this.callbackUrl + `?domain=${this.domain}`,
        };
        const params = URLSearchParams()
        params.set('name', 'note requester v12')
        params.set('permission', 'write:notes')
        params.set('callbackUrl', this.callbackUrl)
        //params.set('icon', '')
        //return await this.get(`${url}?${params.toString()}`, null, params)
        const url = `${endpoint}?${params.toString()}`
        location.href = url
        /*
        const data = {
            method: 'GET',
            headers: this.getJsonHeaders(headers)
        }
        console.debug(url)
        console.debug(data)
        const res = await fetch(url, data)
        console.debug(res)
        const json = await res.json()
        console.debug(json)
        console.debug(JSON.stringify(json))
        return json
        */
    }
    async redirectCallback() {
        const url = new URL(location.href)
        console.debug('----- redirectCallback() -----')
        console.debug(url, url.href)
        console.debug(url.searchParams.has('session'), sessionStorage.getItem(`misskey-domain`))
        if (url.searchParams.has('session')) {
            const domain = sessionStorage.getItem(`misskey-domain`);
            const session = sessionStorage.getItem(`misskey-${domain}-session`);
            const url = `https://${domain}/api/miauth/${session}/check`
            const data = {}
            data.method = 'POST'
            data.headers = this.getJsonHeaders()
            console.debug(data)
            const res = await fetch(url, data)
            console.debug(res)
            const json = await res.json()
            console.debug(json)
            console.debug(JSON.stringify(json))
            sessionStorage.setItem(`misskey-token`, json.token)
            sessionStorage.setItem(`misskey-user`, json.user)
        }
    }
    async getToken(appSecret, token) {
        console.debug('----- token -----')
        const params = {
            appSecret: appSecret,
            token: token,
        };
        return await this.post('auth/session/userkey', null, params)
    }
    /*
    async createApp() {
        console.debug('----- apps(app/create) -----')
        const params = {
            name: `note requester`,
            description: `request note`,
            permission: this.permission,
            callbackUrl: this.callbackUrl,
            //callbackUrl: this.callbackUrl + `?domain=${this.domain}`,
        };
        //return await this.post('api/v1/apps', null, params)
        return await this.post('app/create', null, params)
    }
    async authorize(appSecret) {
        console.debug('----- authorize(auth/session/generate) -----')
        const params = {
            appSecret: appSecret,
        };
        const res = await this.post('auth/session/generate', null, params)
        console.debug(res)
        sessionStorage.setItem(`${this.domain}-token`, res.token);
        sessionStorage.setItem(`misskey-note-text`, this.text);
        const sleep = (second) => new Promise(resolve => setTimeout(resolve, second * 1000))
        await sleep(2)
        window.location.href = res.url
    }
    async getToken(appSecret, token) {
        console.debug('----- token -----')
        const params = {
            appSecret: appSecret,
            token: token,
        };
        return await this.post('auth/session/userkey', null, params)
    }
    async getI(accessToken, appSecret) { return await this.#sha256(accessToken + appSecret) }
    //async getI(appSecret, accessToken) { return await this.#sha256(appSecret + accessToken) }
    */
    async note(i, text) {
        console.debug('----- note -----')
        //const statusEl = document.getElementById('status')
        //const status = (statusEl.hasAttribute('contenteditable')) ? statusEl.innerText : statusEl.value
        //console.debug('status:', status)
        console.debug(i)
        console.debug(text)
        //const headers = { 'Authorization': `Bearer ${accessToken}` }
        //const params = {status: status, visibility:'public'};
        const params = {i:i, text:text};
        return await this.post('notes/create', null, params)
    }
    // https://scrapbox.io/nwtgck/SHA256%E3%81%AE%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5%E3%82%92JavaScript%E3%81%AEWeb%E6%A8%99%E6%BA%96%E3%81%AE%E3%83%A9%E3%82%A4%E3%83%96%E3%83%A9%E3%83%AA%E3%81%A0%E3%81%91%E3%81%A7%E8%A8%88%E7%AE%97%E3%81%99%E3%82%8B
    async #sha256(str) {// const digest = await sha256("hello"); 
        const buff = new Uint8Array([].map.call(str, (c) => c.charCodeAt(0))).buffer;
        const digest = await crypto.subtle.digest('SHA-256', buff);
        return [].map.call(new Uint8Array(digest), x => ('00' + x.toString(16)).slice(-2)).join('');
    }
}

class UUIDv4 {
    static generate() {
        // https://qiita.com/psn/items/d7ac5bdb5b5633bae165
        // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
        // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
        for (let i = 0, len = chars.length; i < len; i++) {
            switch (chars[i]) {
                case "x":
                    chars[i] = Math.floor(Math.random() * 16).toString(16);
                    break;
                case "y":
                    chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                    break;
            }
        }
        return chars.join("");
    }
}

