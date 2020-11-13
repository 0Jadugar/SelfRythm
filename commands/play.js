const strings = require("../strings.json");
const ytdl = require("ytdl-core");
const utils = require("../utils");


function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if(!song){
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
    .on('finish', () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    })
    .on('error', errors => {
        utils.log(errors);
    });

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

}



module.exports.run = async (client, message, args) => {

    if(!args[0] || !utils.isURL(args[0])) return message.channel.send(strings.noLink);

    let voiceChannel = message.member.voice.channel; 

    const serverQueue = queue.get(message.guild.id);

    const songInfo = await ytdl.getInfo(args[0], {filter: "audioonly"});
    const song = {
        title: songInfo.videoDetails.title,
        url: args[0]
    }

    if(!serverQueue) {
        const queueConstruct = {
            textchannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(message.guild.id, queueConstruct)
        queueConstruct.songs.push(song)

        if (voiceChannel != null) { 
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            message.channel.send(strings.startedPlaying.replace("SONG_TITLE", song.title));
            play(message.guild, queueConstruct.songs[0]);
        } else {
            queue.delete(message.guild.id);
            return message.channel.send(strings.notInVocal);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(strings.songAddedToQueue.replace("SONG_TITLE", song.title));
    }

    
};

module.exports.help = {
    name: 'play'
};