class MisskeyApiClient {
    constructor(domain, i) {
        this.client = new MisskeyRestClient(domain)
        this.i = i
    }
    _params(params=null) { return (params) ? {...{i: this.i}, ...params} : {i: this.i} }
    async note(text) {
        console.debug('----- note -----')
        console.debug(this.i)
        console.debug(text)
        return await this.client.post('notes/create', null, this._params({text:text}))
        //const params = this._params({text:text})
        //return await this.client.post('notes/create', null, params)
    }
}
