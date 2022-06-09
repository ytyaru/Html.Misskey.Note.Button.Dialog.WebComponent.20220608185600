window.addEventListener('DOMContentLoaded', async (event) => {
    console.debug('DOMContentLoaded!!');
    document.querySelector(`misskey-note-dialog`).addEventListener('note', async(event) => {
        console.debug('note event: ノートしました！', event.detail);
        document.querySelector(`#res`).value = JSON.stringify(event.detail.json)
    });
});
window.addEventListener('beforeunload', (event) => {
    console.debug('beforeunload!!');
});

