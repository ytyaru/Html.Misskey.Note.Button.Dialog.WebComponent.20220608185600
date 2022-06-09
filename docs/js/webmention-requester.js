class WebmentionRequester {
    async request(json) { // json: note応答
        const url = 'https://webmention.io/aaronpk/webmention'
        const params = new URLSearchParams();
        const sourceUrl = `https://${this.domain}/notes/${json.id}`
        params.set('source', sourceUrl) // ノートのURL。https://misskey.dev/notes/919xbt0i78 など
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
}
