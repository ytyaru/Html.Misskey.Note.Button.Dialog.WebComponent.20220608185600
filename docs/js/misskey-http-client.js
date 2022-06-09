class MisskeyRestClient {
    constructor(domain) {
        this.domain = domain
        this.client = new RestClient()
    }
    async get(endpoint, headers) { this.client.get(`https://${this.domain}/api/${endpoint}`, headers) }
    async post(endpoint, headers, params) { this.client.post(`https://${this.domain}/api/${endpoint}`, headers, params) }
}
