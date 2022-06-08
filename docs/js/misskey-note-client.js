// https://misskey.m544.net/docs/ja-JP/api
class MisskeyNoteClient {
    constructor(domain='misskey.io') {
        const url = new URL(location.href)
        url.searchParams.delete('code');
        this.callbackUrl = url.href
        this.domain = domain
        //this.scope = 'read write follow push'
        //this.scope = 'write:statuses'
        this.permission = ['write:notes'] // https://misskey.m544.net/api-doc/#section/Permissions
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
    async createApp() {
        console.debug('----- apps(app/create) -----')
        const params = {
            name: `note requester`,
            description: `request note`,
            permission: this.permission,
            callbackUrl: this.callbackUrl + `?domain=${this.domain}`,
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
        console.debug(res.url)
        //window.location.href = res.url
    }
    async getToken(appSecret, token) {
        console.debug('----- token -----')
        const params = {
            appSecret: appSecret,
            token: token,
        };
        return await this.post('auth/session/userkey', null, params)
    }
    async getI(appSecret, accessToken) { return this.#sha256(appSecret + accessToken) }
    /*
    async verify(accessToken) {
        console.debug('----- verify -----')
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
        };
        const res = await this.get('api/v1/apps/verify_credentials', headers, null)
        if (res.hasOwnProperty('error')) { return false }
        return true
    }
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
