// https://misskey.m544.net/docs/ja-JP/api
// 12.39.1以降の認証はOAuthでなくMiAuthという独自手法を使うらしい。互換性皆無。
class MisskeyAuthorizerV12 { // https://forum.misskey.io/d/6-miauth
    constructor(domain='misskey.io') {
        const url = new URL(location.href)
        url.searchParams.delete('code');
        this.callbackUrl = url.href
        this.domain = domain
        this.permission = 'write:notes' カンマ区切り。// https://misskey.m544.net/api-doc/#section/Permissions
        this.client = {
            rest: new RestClient(),
            misskey: new MisskeyRestClient(),
        }
    }
    getDefaultJsonHeaders() { return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }}
    getJsonHeaders(headers=null) { return (headers) ? {...this.getDefaultJsonHeaders(), ...headers} : this.getDefaultJsonHeaders() }
    async authorize() {
        console.debug('----- misskey v12 authorize -----')
        sessionStorage.setItem(`misskey-v12-domain`, this.domain)
        const session = UUIDv4.generate()
        sessionStorage.setItem(`misskey-v12-${this.domain}-session`, session)
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
        const url = `${endpoint}?${params.toString()}`
        location.href = url
    }
    async redirectCallback() {
        const url = new URL(location.href)
        console.debug('----- redirectCallback() -----')
        console.debug(url, url.href)
        console.debug(url.searchParams.has('session'), sessionStorage.getItem(`misskey-v12-domain`))
        if (url.searchParams.has('session')) {
            const domain = sessionStorage.getItem(`misskey-v12-domain`);
            const session = sessionStorage.getItem(`misskey-v12-${domain}-session`);
            const json = this.client.misskey.post(`miauth/${session}/check`, null, null)
            sessionStorage.setItem(`misskey-v12-token`, json.token)
            sessionStorage.setItem(`misskey-v12-user`, json.user)
            sessionStorage.setItem(`${domain}-i`, json.token)
        }
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

