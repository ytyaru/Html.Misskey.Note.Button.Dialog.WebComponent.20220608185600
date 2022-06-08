window.addEventListener('DOMContentLoaded', async (event) => {
    console.debug('DOMContentLoaded!!');
    const client = new MisskeyNoteClient()
    const app = await client.createApp()
    console.log(app)
    await client.authorize()

    document.querySelector(`toot-dialog`).addEventListener('toot', async(event) => {
        console.debug('トゥートしました！ここから先はWebComponent,brid.gyと連携させたい。', event.detail);
        document.querySelector(`#res`).value = JSON.stringify(event.detail.json)
    });
});
window.addEventListener('beforeunload', (event) => {
    console.debug('beforeunload!!');
});

