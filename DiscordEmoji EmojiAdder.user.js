// ==UserScript==
// @name         DiscordEmoji EmojiAdder
// @namespace    https://cirno.pw
// @version      0.1
// @description  Adds a button that will automatically add emoji to your servers for you from DiscordEmoji.com.
// @author       ExtraConcentratedJuice
// @license      MIT
// @match        https://discordemoji.com/category/*
// @match        https://discordemoji.com/search.php
// @match        https://discordemoji.com/
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/npm/jquery.initialize@1.2.0/jquery.initialize.min.js
// ==/UserScript==

(function() {
    'use strict';

    const TOKEN_KEY = 'emojiadder_token';
    const GUILD_KEY = 'emojiadder_guild';
    var count = 0;

    function addButton()
    {
        $('div.meta > div.float-right').each(function(index)
        {
            if (!$(this).find('.fa-plus-circle').length)
            {
                let name = $(this).parent().parent().find('h4').find('a').text();
                let url = $(this).closest('.emoji').find('img').attr('data-src');
                $(this).append('&nbsp; <a id="addButton' + count + '"><i class="fas fa-plus-circle" style="cursor: pointer; color: #52bd8c;" data-url="' + url+ '" data-name="' + name + '"></i></a>');

                $('#addButton' + count).click(function()
                {
                    $.growl.warning({ message: 'Preparing to add :' + name + ': to your server...' });
                    getBase64FromImage(url, function(data)
                    {
                        let size = data.length * 0.001;
                        if (size > 256)
                        {
                            $.growl.error({ message: 'The emoji :' + name + ': is over 256kb. Discord\'s max emoji size is 256kb. Go bother Kohai to fix it.' });
                            return;
                        }
                        let xhr = new XMLHttpRequest();
                        xhr.open('POST', 'https://canary.discordapp.com/api/v6/guilds/' + GM_getValue(GUILD_KEY, '') + '/emojis');
                        xhr.setRequestHeader('Authorization', GM_getValue(TOKEN_KEY, ''));
                        xhr.setRequestHeader('Content-Type', 'application/json');

                        xhr.onreadystatechange = function()
                        {
                            if (xhr.readyState == XMLHttpRequest.DONE)
                            {
                                let respCode = xhr.status;

                                switch(respCode)
                                {
                                    case 400:
                                        $.growl.error({ message: 'The emoji failed to submit to Discord.' });
                                        break;
                                    case 403:
                                        $.growl.error({ message: 'You are not authorized to submit emojis to this guild. Check your token, check your guild ID. Click the cog icon on the bottom right.' });
                                        break;
                                    case 429:
                                        $.growl.error({ message: 'Discord has ratelimited you from uploading emojis. Try again later.' });
                                        break;
                                    case 201:
                                        $.growl.notice({ message: 'Successfully added :' + name + ': to your server!' });
                                        break;
                                    default:
                                        $.growl.error({ message: 'An unexpected status code was received from Discord. Whatever it is, it probably isn\'t good. Try again, I guess.' });
                                        break;
                                }
                            }
                        }
                        xhr.send(JSON.stringify(
                            {
                                'name': name,
                                'image': data
                            }
                        ));
                    });
                });

                count++;
            }
        });
    }

    function getBase64FromImage(url, callback)
    {
        let xhr = new XMLHttpRequest();
        xhr.onload = function()
        {
            var reader = new FileReader();
            reader.onloadend = function()
            {
                callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }

    function configure()
    {
        let token = prompt('Enter your Discord user token. Don\'t know how to get it?\nhttps://github.com/TheRacingLion/Discord-SelfBot/wiki/Discord-Token-Tutorial', GM_getValue(TOKEN_KEY, ''));
        let guild = prompt('Enter the Guild ID of your server. Don\'t know how to get it?\nhttps://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-', GM_getValue(GUILD_KEY, ''));
        GM_setValue(TOKEN_KEY, token);
        GM_setValue(GUILD_KEY, guild);
        alert('Set your token to: ' + token + '\nSet your guild ID to: ' + guild);
    }

    $(document).ready(function ()
    {
        $('body').append('<button id="emojiAdderConfigure" class="btn" style="position: fixed; bottom: 5px; right: 5px;"><i class="fas fa-cog"></i></button>');
        $('#emojiAdderConfigure').click(configure);
    });

    $.initialize('.emoji', addButton);
})();