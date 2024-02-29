const SOCKET_URL = "wss://free.blr2.piesocket.com/v3/1?api_key=BFJuJjDOkT7B7lKD6WodSFPXAAo123lItRb771JN&notify_self=1";


const KEY_FUNCTION_MAP = {
    "create3": async data => {
        await join2(data.key, data.channel, data.uid);
    },
    "play1": data => ag_play(data.url,data.type),
    "volume1": data => setVolume(data.volume),
    "mute1": async data => { await muteAudio() },
    "unmute1": async data => { await unmuteAudio() },
    "stop1": async data => { await stop_play() }
};

function info(key, data) {
    if (key in KEY_FUNCTION_MAP) {
        KEY_FUNCTION_MAP[key](data);
    }
}

function handleMessage(message) {
    try {
        const messageObject = JSON.parse(message);
        if (messageObject && messageObject.selenium) {
            const { key, data } = messageObject.selenium;
            if (key && data) {
                console.log(`RESPONSE (as object):`, messageObject);
                if (chatId1 == data.chatId) {
                    info(key, data);
                }
            }
        }
    } catch (error) {
        console.error(`RESPONSE (not a valid JSON): ${message}`);
    }
}

function runWebSocket() {
    try {
        const ws = new WebSocket(SOCKET_URL);

        ws.onmessage = event => handleMessage(event.data);

        console.log("[socket][start] Socket Started");
        // setTimeout(() => {
        //     ws.send("hellllll");
        // }, 3000);
        // You may want to handle WebSocket closing and errors here
    } catch (error) {
        console.error(error);
    }
}

runWebSocket();
