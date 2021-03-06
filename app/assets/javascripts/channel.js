var UserChannel = (function() {

    var dispatcher, channelName, cookieName = 'user_channel_key';

    function init(globalDispatcher) {
        dispatcher = globalDispatcher;
        dispatcher.on_open = connect;
        channelName = $.cookie(cookieName)
    }

    function connect() {
       if(channelName) {
           getChannel(channelName);
       } else {
           getKey();
       }
    }

    function getKey() {
        dispatcher.bind('user.key', function (key) {
            $.cookie(cookieName, key, { expires: 30 });
            getChannel(key);
        });

        dispatcher.trigger('user.get_channel_key', {});
    }

    function getChannel(key) {
        var channel = dispatcher.subscribe_private(key);

        channel.on_success = function () {
            // listen for notifications or some other user specific event
        };

        channel.on_failure = function (reason) {
            $.removeCookie(cookieName);
            console.log("Authorization failed because " + reason.message);
        };
    }

    return { init: init };

})();
var UserMonitor = (function() {

    var dispatcher, channel, onlineUsers, $userCountContainer;

    function init(globalDispatcher) {
        dispatcher = globalDispatcher;
        channel = dispatcher.subscribe('online_users');
        channel.bind('seen', userOnline);
        channel.bind('left', userOffline);
        setOnlineUserCount();
        $(".left").on('click',function(e) { dispatcher.trigger('client_disconnected', {});})
    }

    function setOnlineUserCount() {
       $userCountContainer = $('#online-user-count');
       if($userCountContainer.length) {
           onlineUsers = parseInt($userCountContainer.html(), 10);
       }
    }

    function userOnline(user) {
        var $onlineUser = $('.online-user[data-user-id="'+user.id+'"]');
        $onlineUser.addClass('online');
        $onlineUser.removeClass('offline');
        $onlineUser.html('online');
        if($userCountContainer.length) {
            updateOnlineUserCount(++onlineUsers);
        }
    }

    function userOffline(user) {
        var $offlineUser = $('.online-user[data-user-id="'+user.id+'"]');
        $offlineUser.removeClass('online');
        $offlineUser.addClass('offline');
        $offlineUser.html('offline');
        if($userCountContainer.length) {
            updateOnlineUserCount(--onlineUsers);
        }
    }

    function updateOnlineUserCount(count) {
        $userCountContainer.html(count);
    }

    return { init: init };

}());
$(document).on('ready', function() {
    var globalDispatcher = new WebSocketRails('localhost:3000/websocket');
    UserChannel.init(globalDispatcher);
    UserMonitor.init(globalDispatcher);
});