// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// --- CHANNEL CONFIGURATION ---
// Define a map of channel IDs to their base M3U8 URLs.
// IMPORTANT: These must be BASE URLs (e.g., ending in playlist.m3u8, not chunklist.m3u8),
// and they should ideally respond with a 302 redirect to a tokenized URL for the proxy to work.
// URLs with existing tokens or complex ad parameters might fail if the base URL itself is blocked.
const channelMap = {
    "bbo": {
        baseURL: "https://livegeoroueu.akamaized.net/28072023/smil:bbo1.smil/playlist.m3u8?hdnts=st=1749305751~exp=1749309351~acl=!*/28072023/smil:bbo1.smil/*!yuppTVCom_5_24049354_c24505a291c14922_US_65.181.111.29~data=yuppTVCom_5_24049354_c24505a291c14922_US_65.181.111.29~hmac=fd9b85f355477e151524dbbe948ca1f26ae3a7b5319ed2ec101739f771975b63&ads.app_bundle=&ads.app_store_url=&ads.content_livestream=1&ads.language=HIN&ads.content_genre=MOV&ads.channel=3529&ads.channel_name=BBO&ads.network_name=yupptv&ads.user=1",
        name: "BBO Stream (Akamai - *might be blocked*)"
    },
    "mstv-desi-play": {
        baseURL: "https://desiplaylive.akamaized.net/ptnr-yupptv/v1/manifest/611d79b11b77e2f571934fd80ca1413453772ac7/vglive-sk-660691/4cf68f50-0c5e-47a6-96e3-b78797a2b6fe/1.m3u8",
        name: "MSTV DESI PLAY"
    },
    "b4u-kadak": {
        baseURL: "https://cdnb4u.wiseplayout.com/B4U_Kadak/master.m3u8",
        name: "B4U KADAK"
    },
    "nazara-tv": {
        baseURL: "https://epiconvh.akamaized.net/live/nazara/master.m3u8",
        name: "NAZARA TV"
    },
    "ishara-tv": {
        baseURL: "https://epiconvh.akamaized.net/live/ishaara/master.m3u8",
        name: "ISHARA TV"
    },
    "aaj-tak-hd-1": { // Renamed to avoid duplicate ID
        baseURL: "https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8",
        name: "AAJ TAK HD"
    },
    "news-nation": {
        baseURL: "https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/6cd2f649739a45ca9de1daf81cc7d0f2/index.m3u8",
        name: "NEWS NATION"
    },
    "joo-music": {
        baseURL: "https://livecdn.live247stream.com/joomusic/tv/playlist.m3u8",
        name: "JOO MUSIC"
    },
    "arre-tv": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/arre/master.m3u8",
        name: "ARRE TV"
    },
    "q-kahaniyaa-hd": {
        baseURL: "https://vg-theqlive.akamaized.net/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/vglive-sk-640586/main.m3u8",
        name: "Q KAHANIYAA HD"
    },
    "yrf-music-1": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/yrf-music/master.m3u8",
        name: "YRF MUSIC"
    },
    "bollywood-classic-hd-1": { // Renamed to avoid duplicate ID
        baseURL: "https://shls-live-ak.akamaized.net/out/v1/485100a2150e4f69a338a5c99ca5648e/index.m3u8",
        name: "BOLLYWOOD CLASSIC HD"
    },
    "abzy-movies": {
        baseURL: "https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/db8d4eca72d64748a00d0631debf542d/index.m3u8",
        name: "ABZY MOVIES"
    },
    "dd-bharti": {
        baseURL: "https://cdn-1.pishow.tv/live/10/master.m3u8",
        name: "DD BHARTI"
    },
    "gubbare-tv": {
        baseURL: "https://epiconvh.akamaized.net/live/gubbare/master.m3u8",
        name: "GUBBARE TV"
    },
    "entertainment-24": {
        baseURL: "https://bagnetwork.digivive.com/hlslive/Admin/px09241091/live/E24LiveB/master_1.m3u8",
        name: "ENTERTAINMENT 24"
    },
    "zee-zoom-tv-1": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/zoom-tv/master.m3u8",
        name: "ZEE ZOOM TV"
    },
    "dd-india": {
        baseURL: "https://livegeoroueu.akamaized.net/120723/smil:ddindiahd.smil/playlist.m3u8", // Stripped token
        name: "DD INDIA"
    },
    "dangal-entertainment-tv-1": { // Renamed to avoid duplicate ID
        baseURL: "https://live-dangal.akamaized.net/liveabr/playlist.m3u8",
        name: "DANGAL ENTERTAINMENT TV"
    },
    "dangal-entertainment-2-1": { // Renamed to avoid duplicate ID
        baseURL: "https://live-dangal2.akamaized.net/liveabr/playlist.m3u8",
        name: "DANGAL ENTERTAINMENT 2"
    },
    "epic-tv": {
        baseURL: "https://epiconvh.akamaized.net/live/epic/master.m3u8",
        name: "EPIC TV"
    },
    "chumbak-tv": {
        baseURL: "https://cdn.live.shemaroome.com/shemarooChumbakTV/smil:shemarooChumbakTVadp.smil/playlist.m3u8", // Stripped token
        name: "CHUMBAK TV"
    },
    "movie-plus": {
        baseURL: "https://cdn-2.pishow.tv/live/1155/master.m3u8",
        name: "MOVIE PLUS"
    },
    "bollywood-masala-1": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/bollywood-masala/master.m3u8",
        name: "BOLLYWOOD MASALA"
    },
    "9x-jalwa": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/9x-jalwa/master.m3u8",
        name: "9X JALWA"
    },
    "9x-music": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/9xm/master.m3u8",
        name: "9X MUSIC"
    },
    "shemaroo-filmigaane": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/shemaroo-filmigaane/master.m3u8",
        name: "SHEMAROO FILMI GAANE"
    },
    "shemaroo-umang": {
        baseURL: "https://cdn.live.shemaroome.com/shemarooumang/smil:shemarooumangadp.smil/playlist.m3u8", // Stripped token
        name: "SHEMAROO UMANG"
    },
    "music-mastii-1": { // Renamed to avoid duplicate ID
        baseURL: "https://sablive-ddpb.akamaized.net/mastii/playlist.m3u8",
        name: "MUSIC MASTII"
    },
    "sony-kal": {
        baseURL: "https://spt-sonykal-1-us.lg.wurl.tv/playlist.m3u8",
        name: "SONY KAL"
    },
    "bbo-hd": {
        baseURL: "https://livegeoroueu.akamaized.net/28072023/smil:bbo1.smil/playlist.m3u8", // Stripped token
        name: "BBO HD"
    },
    "shemaroo-bollywood": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/shemaroo-bollywood/master.m3u8",
        name: "SHEMAROO BOLLYWOOD"
    },
    "bollywood-hd-1": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/bollywood-hd/manifest.m3u8",
        name: "BOLLYWOOD HD"
    },
    "bollywood-4u": {
        baseURL: "https://streams2.sofast.tv/ptnr-yupptv/title-BOLLYWOOD-4U-ENG_yupptv/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/22d13e33-8705-40e8-9809-4e80aa795f15/manifest.m3u8", // Stripped token
        name: "BOLLYWOOD 4 U"
    },
    "sai-leela-tv": {
        baseURL: "https://otttv.co.in/d2h/livestream/sai-leela/master.m3u8",
        name: "SAI LEELA TV"
    },
    "chana-jor": {
        baseURL: "https://yupptv-chanajor.akamaized.net/ptnr-yupptv/title-Chanajor/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b5663d20-93c0-4ea1-9a86-d114a67f75db/main.m3u8", // Stripped token
        name: "CHANA JOR"
    },
    "dhamaka-movies": {
        baseURL: "https://cdn-1.pishow.tv/live/235/master.m3u8",
        name: "DHAMAKA MOVIES"
    },
    "manoranjan-grand": {
        baseURL: "https://cdn-1.pishow.tv/live/1011/master.m3u8",
        name: "MANORANJAN GRAND"
    },
    "comedy-tadka": {
        baseURL: "https://streams2.sofast.tv/ptnr-yupptv/title-Comedy_Tadka_YUPPTV/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/0abe00bb-b6f3-4dcd-bdf6-12e74e08216c/master.m3u8", // Stripped token
        name: "COMEDY TADKA"
    },
    "b4u-music": {
        baseURL: "https://cdnb4u.wiseplayout.com/B4U_Music/master.m3u8",
        name: "B4U MUSIC"
    },
    "b4u-movies": {
        baseURL: "https://cdnb4u.wiseplayout.com/B4U_Movies/master.m3u8",
        name: "B4U MOVIES"
    },
    "xumo-bollywood-1": { // Renamed to avoid duplicate ID
        baseURL: "https://dbrb49pjoymg4.cloudfront.net/10001/99991756/hls/master.m3u8", // Stripped params
        name: "XUMO BOLLYWOOD"
    },
    "zee-bollyworld-1": { // Renamed to avoid duplicate ID
        baseURL: "https://stream.ads.ottera.tv/playlist.m3u8", // Stripped params
        name: "ZEE BOLLYWORLD"
    },
    "d2p372oxiwmcn1": { // Generic ID, please provide a better name
        baseURL: "https://d2p372oxiwmcn1.cloudfront.net/hls/main.m3u8",
        name: "D2P372OXIWMC N1 Stream"
    },
    "india-news-hd": {
        baseURL: "https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index.m3u8",
        name: "INDIA NEWS HD"
    },
    "india-speed-news": {
        baseURL: "https://poclive-indiatvnews.akamaized.net/hlslive/Admin/px0219297/live/janya/master.m3u8",
        name: "INDIA SPEED NEWS"
    },
    "lok-sabha-tv": {
        baseURL: "https://playhls.media.nic.in/hls/live/lstv/lstv.m3u8",
        name: "LOK SABHA TV"
    },
    "aap-ke-adalat": {
        baseURL: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01550-indiatv-indiatv-aapkiadalat-mi-xiaomi/playlist.m3u8",
        name: "AAP KE AADALAT"
    },
    "abp-news": {
        baseURL: "https://abplivetv.pc.cdn.bitgravity.com/httppush/abp_livetv/abp_abpnews/master.m3u8",
        name: "ABP NEWS"
    },
    "delhi-ncr-haryana": {
        baseURL: "https://d2s40ae9uabrl.cloudfront.net/index.m3u8", // Stripped token
        name: "DELHI NCR HARYANA"
    },
    "ghaint-punjabi": {
        baseURL: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01412-xiaomiasia-ghaintpunjab-xiaomi/playlist.m3u8",
        name: "GHAINT PUNJABI"
    },
    "tabbar-hits": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/tabbar-hits/index.m3u8", // Stripped params
        name: "TABBAR HITS"
    },
    "republic-bharat": {
        baseURL: "https://vg-republictvlive.akamaized.net/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/vglive-sk-275673/main.m3u8", // Stripped params
        name: "REPUBLIC BHARAT"
    },
    "green-gold-tv": {
        baseURL: "https://greengold-yupptv.vgcdn.net/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/af835e36-30e1-426f-b0d4-7383a330d69c/main.m3u8", // Stripped token
        name: "GREEN GOLD TV"
    },
    "sikh-ratnavali": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/sikh-ratnavali/master.m3u8", // Stripped params
        name: "SIKH RATNAVALI"
    },
    "bollywood-masala-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/bollywood-masala/index.m3u8", // Stripped params
        name: "BOLLYWOOD MASALA"
    },
    "saga-music-hd": {
        baseURL: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01412-xiaomiasia-sagamusic-xiaomi/playlist.m3u8",
        name: "SAGA MUSIC HD"
    },
    "b4u-movies-2": { // Renamed to avoid duplicate ID
        baseURL: "https://amg00877-b4unew-amg00877c2-xiaomi-in-5489.playouts.now.amagi.tv/playlist.m3u8",
        name: "B4U MOVIES"
    },
    "mh-one": {
        baseURL: "https://mhlive.paramountinfosystem.com/mhonemusictest/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8",
        name: "MH ONE"
    },
    "green-chillies": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/green-chillies-tv/playlist.m3u8", // Stripped params
        name: "GREEN CHILLIES"
    },
    "saga-haryanvi": {
        baseURL: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01412-xiaomiasia-sagamusicharyanvi-xiaomi/playlist.m3u8",
        name: "SAGA HARYANVI"
    },
    "bollywood-hd-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/bollywood-hd/manifest.m3u8", // Stripped params
        name: "BOLLYWOOD HD"
    },
    "cartoon-network": {
        baseURL: "https://vodzong.mjunoon.tv:8087/streamtest/cartoon-network-87/playlist.m3u8",
        name: "CARTOON NETWORK"
    },
    "hamara-tv-pak": {
        baseURL: "https://j7md5mbeyrwv-hls-live.5centscdn.com/hamara/c9a1fdac6e082dd89e7173244f34d7b3.sdp/playlist.m3u8",
        name: "HAMARA TV (PAK)"
    },
    "brit-asia-tv": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/britasiatv/master.m3u8", // Stripped params
        name: "BRIT ASIA TV"
    },
    "india-life-tv": {
        baseURL: "https://m6gdavepdn93-hls-live.5centscdn.com/pravasi/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8",
        name: "INDIA LIFE TV"
    },
    "channel-seven-aus": {
        baseURL: "https://npc.cdn.7livecloud.io/hls/live/MEL6/master.m3u8",
        name: "CHANNEL SEVEN (AUS)"
    },
    "zee-news": {
        baseURL: "https://dknttpxmr0dwf.cloudfront.net/index.m3u8", // Stripped token
        name: "ZEE NEWS"
    },
    "dd-national": {
        baseURL: "https://cdn-1.pishow.tv/live/11/master.m3u8",
        name: "DD NATIONAL"
    },
    "zee-salaam": {
        baseURL: "https://vg-zeefta.akamaized.net/ptnr-yupptv/title-zeesalaam/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/426c6db7-595e-4aa8-859c-7e86ed2811d0/main.m3u8", // Stripped token/params
        name: "ZEE SALAAM"
    },
    "horror-tv": {
        baseURL: "https://streams2.sofast.tv/ptnr-yupptv/title-HORROR-TV-ENG_yupptv/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/93dc292b-cbcf-4988-ab97-94feced4c14b/master.m3u8", // Stripped token/params
        name: "HORROR TV"
    },
    "apna-punjab-tv": {
        baseURL: "https://plus.gigabitcdn.net/live-stream/apna-punjab-H3sE/playlist.m3u8",
        name: "APNA PUNJAB TV"
    },
    "hamdard-tv": {
        baseURL: "https://tv.hamdardtv.com/hamdard/index.m3u8",
        name: "HAMDARD TV"
    },
    "ishwar-tv": {
        baseURL: "https://6n3yow8pl9ok-hls-live.5centscdn.com/ishwartvlive/tv.stream/playlist.m3u8",
        name: "ISHWAR TV"
    },
    "mh-one-shardha": {
        baseURL: "https://mhlive.paramountinfosystem.com/mhoneshraddhatest/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8",
        name: "MH ONE SHARDHA"
    },
    "mastii-music-2": { // Renamed to avoid duplicate ID
        baseURL: "https://sabliveyupp.akamaized.net/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/sablive_https/mastii/playlist.m3u8",
        name: "MASTII MUSIC"
    },
    "goldmines-bollywood": {
        baseURL: "https://cdn-2.pishow.tv/live/1460/master.m3u8",
        name: "GOLDMINES BOLLYWOOD"
    },
    "goldmines-movies": {
        baseURL: "https://cdn-2.pishow.tv/live/1461/master.m3u8",
        name: "GOLDMINES MOVIES"
    },
    "hindi-news": {
        baseURL: "https://stream-us-east-1.getpublica.com/playlist.m3u8", // Stripped params
        name: "HINDI NEWS"
    },
    "hallmark-murder-mysteries": {
        baseURL: "https://fl2.moveonjoy.com/HALLMARK_MOVIES_MYSTERIES/index.m3u8",
        name: "HALLMARK MURDER & MYSTERIES"
    },
    "heartland-tv-usa": {
        baseURL: "https://sr-live4-frndly.akamaized.net/out/v1/01af02e4a23e4e30af639feb328b1a66/index.m3u8", // Stripped token
        name: "HEARTLAND TV USA"
    },
    "bollywood-classic-hd-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/bollywood-hd/manifest.m3u8",
        name: "BOLLYWOOD CLASSIC HD"
    },
    "dangal-2-2": { // Renamed to avoid duplicate ID
        baseURL: "https://live-dangal2.akamaized.net/liveabr/playlist.m3u8",
        name: "DANGAL 2"
    },
    "news18-pun-har-him": {
        baseURL: "https://n18syndication.akamaized.net/bpk-tv/News18_Punjab_Haryana_HP_NW18_MOB/output01/News18_Punjab_Haryana_HP_NW18_MOB-audio_98835_eng=98800-video=3724000.m3u8",
        name: "NEWS18 PUN/HAR/HIM"
    },
    "india-tv": {
        baseURL: "https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index_3.m3u8",
        name: "INDIA TV"
    },
    "yrf-music-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/yrf-music/master.m3u8",
        name: "YRF MUSIC"
    },
    "goldmine": {
        baseURL: "https://cdn-2.pishow.tv/live/1459/master.m3u8",
        name: "GOLDMINE"
    },
    "abc-me-australia": {
        baseURL: "https://c.mjh.nz/abc-me.m3u8",
        name: "ABC ME (AUSTRALIA)"
    },
    "amc-thrillers-eng": {
        baseURL: "https://436f59579436473e8168284cac5d725f.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Plex_RushByAMC/playlist.m3u8",
        name: "AMC THRILLERS (ENG)"
    },
    "dangal-tv": {
        baseURL: "https://live-dangal.akamaized.net/liveabr/playlist.m3u8",
        name: "DANGAL TV"
    },
    "dangal-2-3": { // Renamed to avoid duplicate ID
        baseURL: "https://live-dangal2.akamaized.net/liveabr/pub-iodanga2a26kj2/live_720p/chunks.m3u8",
        name: "DANGAL 2"
    },
    "zee-tv-usa": {
        baseURL: "http://143.244.60.30/BBC_AMERICA/index.m3u8",
        name: "ZEE TV USA $$$"
    },
    "mastii-music-3": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/mastiii/master.m3u8", // Stripped params
        name: "MASTII MUSIC"
    },
    "punjabi-hits": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/punjabi-hits/master.m3u8",
        name: "PUNJABI HITS"
    },
    "zee-zoom-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/zoom-tv/master.m3u8",
        name: "ZEE ZOOM"
    },
    "zee-bollyworld-2": { // Renamed to avoid duplicate ID
        baseURL: "https://stream.ads.ottera.tv/playlist.m3u8", // Stripped params
        name: "ZEE BOLLYWORLD"
    },
    "utsav-bharat": {
        baseURL: "https://livegeoroueu.akamaized.net/120723/smil:lifeokuk.smil/playlist.m3u8", // Stripped token
        name: "UTSAV BHARAT"
    },
    "xumo-bollywood-2": { // Renamed to avoid duplicate ID
        baseURL: "https://dbrb49pjoymg4.cloudfront.net/10001/99991756/hls/master.m3u8", // Stripped params
        name: "XUMO BOLLYWOOD"
    },
    "comedy-king-movies": {
        baseURL: "https://amg01448-samsungindia-amg01448c6-samsung-in-2297.playouts.now.amagi.tv/playlist/amg01448-samsungindia-comedyking-samsungin/playlist.m3u8",
        name: "COMEDY KING MOVIES"
    },
    "rdc-movies": {
        baseURL: "https://janya-rdcmovies.akamaized.net/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/230a723f-867d-4fa3-b2d2-a622ba994cd2/main.m3u8",
        name: "RDC MOVIES"
    },
    "e-24": {
        baseURL: "https://live-e24.dailyhunt.in/eternowsa/live/amlst:E24_,b256,b512,b1024,b1824,.smil/playlist.m3u8",
        name: "E 24"
    },
    "balle-balle-music": {
        baseURL: "https://mcncdndigital.com/balleballetv/index.m3u8",
        name: "BALLE BALLE MUSIC"
    },
    "9xm-music-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d14c63magvk61v.cloudfront.net/strm/channels/9xm/master.m3u8",
        name: "9XM MUSIC"
    },
    "9x-jalwaa-2": { // Renamed to avoid duplicate ID
        baseURL: "https://d14c63magvk61v.cloudfront.net/strm/channels/9xjalwa/master.m3u8",
        name: "9X JALWAA"
    },
    "freebie-tv-usa": {
        baseURL: "https://d1h1d6qoy9vnra.cloudfront.net/v1/master/9d062541f2ff39b5c0f48b743c6411d25f62fc25/Freebie-Plex/187.m3u8",
        name: "FREEBE TV USA"
    },
    "dubai-one-eng": {
        baseURL: "https://dminnvllta.cdn.mgmlcdn.com/dubaione/smil:dubaione.stream.smil/chunklist.m3u8",
        name: "DUBAI ONE (ENG)"
    },
    "mbc-bollywood": {
        baseURL: "https://shls-mbcbollywood-prod-dub.shahid.net/out/v1/a79c9d7ef2a64a54a64d5c4567b3462a/index.m3u8",
        name: "MBC BOLLYWOOD"
    },
    "parayavaran-tv": {
        baseURL: "https://webtv-stream.nettv.com.np/broadcaster/Paryawaran.stream/playlist.m3u8",
        name: "PARAYAVARAN TV"
    },
    "kids-tv": {
        baseURL: "https://cdn4.skygo.mn/live/disk1/Zoomoo/HLSv3-FTA/Zoomoo.m3u8",
        name: "KIDS TV"
    },
    "aljazeera-news": {
        baseURL: "https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/al-jazeera-english/playlist.m3u8",
        name: "ALJAZEERA NEWS"
    },
    "cna-international": {
        baseURL: "https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8",
        name: "CNA INTERNATIONAL"
    },
};
// --- END CHANNEL CONFIGURATION ---

// Define a dynamic GET endpoint for all streams
app.get('/stream/:channelId', async (req, res) => {
    const channelId = req.params.channelId;
    const channelInfo = channelMap[channelId];

    if (!channelInfo) {
        console.warn(`[${new Date().toISOString()}] Client requested unknown channel ID: ${channelId}`);
        return res.status(404).send(`Channel '${channelId}' not found.`);
    }

    const BASE_M3U8_URL = channelInfo.baseURL;

    console.log(`[${new Date().toISOString()}] Client requested ${channelInfo.name} (${channelId}). Attempting to fetch fresh URL from ${BASE_M3U8_URL}...`);

    try {
        const response = await axios.get(BASE_M3U8_URL, {
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 303;
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Referer': 'https://www.google.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            }
        });

        let freshM3U8Url;

        if (response.status === 302 || response.status === 301) {
            freshM3U8Url = response.headers.location;
            console.log(`[${new Date().toISOString()}] Detected redirect for ${channelInfo.name} to: ${freshM3U8Url}`);
        } else if (response.status === 200) {
            freshM3U8Url = BASE_M3U8_URL;
            console.log(`[${new Date().toISOString()}] Direct 200 OK for ${channelInfo.name}, serving base URL.`);
        } else {
            console.error(`[${new Date().toISOString()}] Unexpected status from ${channelInfo.name}: ${response.status}`);
            return res.status(500).send(`Failed to get fresh stream URL for ${channelInfo.name}: Unexpected status from source.`);
        }

        if (freshM3U8Url) {
            res.redirect(302, freshM3U8Url);
            console.log(`[${new Date().toISOString()}] Redirected client for ${channelInfo.name} to: ${freshM3U8Url}`);
        } else {
            res.status(500).send(`Failed to get fresh stream URL for ${channelInfo.name}: No valid URL found.`);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching fresh stream URL for ${channelInfo.name}:`, error.message);
        if (error.response) {
            console.error(`[${new Date().toISOString()}] Status: ${error.response.status}, Data: ${error.response.data}`);
        }
        res.status(500).send(`Failed to get fresh stream URL for ${channelInfo.name}. Please try again later.`);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Stream proxy server listening on port ${port}`);
    console.log(`[${new Date().toISOString()}] Access streams via: http://127.0.0.1:${port}/stream/:channelId`);
});
