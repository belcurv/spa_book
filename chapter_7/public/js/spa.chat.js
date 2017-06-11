/* spa.chat.js
 * Chat feature module for SPA
*/

/* jshint esversion:6, browser:true */
/* globals jQuery, spa */

spa.chat = (function ($) {
    
    'use strict';
    
    /* ==================== INIT MODULE SCOPE VARIABLES ==================== */
    
    var 
    
        // static configuration values
        configMap = {
            
            // html template
            main_html: `
                <div class="spa-chat">
                    <div class="spa-chat-head">
                        <div class="spa-chat-head-toggle">+</div>
                        <div class="spa-chat-head-title">Chat</div>
                    </div>
                    <div class="spa-chat-closer">x</div>
                    <div class="spa-chat-sizer">
                        <div class="spa-chat-list">
                            <div class="spa-chat-list-box"></div>
                        </div>
                        <div class="spa-chat-msg">
                            <div class="spa-chat-msg-log"></div>
                            <div class="spa-chat-msg-in">
                                <form class="spa-chat-msg-form">
                                    <input type="text" />
                                    <input type="submit" style="display:none" />
                                    <div class="spa-chat-msg-send">send</div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>`,
            
            // permitted chat settings
            settable_map: {
                slider_open_time    : true,
                slider_close_time   : true,
                slider_opened_em    : true,
                slider_closed_em    : true,
                slider_opened_title : true,
                slider_closed_title : true,
                chat_model          : true,
                people_model        : true,
                set_chat_anchor     : true
            },
            
            // slider animation settings
            slider_open_time        : 250,
            slider_close_time       : 250,
            // slider_opened_em        : 18,  // now set in setPxSizes()
            slider_closed_em        : 2,
            slider_opened_min_em    : 10,
            window_height_min_em    : 20,
            slider_opened_title     : 'Tap to close',
            slider_closed_title     : 'Tap to open',
            
            // placeholders
            chat_model              : null,
            people_model            : null,
            set_chat_anchor         : null
            
        },
        
        // dynamic information shared throughout module
        stateMap = {
            $append_target   : null,
            position_type    : 'closed',
            px_per_em        : 0,
            slider_hidden_px : 0,
            slider_closed_px : 0,
            slider_opened_px : 0
        },
        
        // jQuery collections cache container
        jqueryMap = {};
        
    
    /* ========================== UTILITY METHODS ========================== */
    
        
    /* ============================ DOM METHODS ============================ */
    
    /* cache jQuery collections to reduce DOM traversals & improve performance
    */
    function setJqueryMap() {
        var $append_target = stateMap.$append_target,
            $slider = $append_target.find('.spa-chat');
        
        jqueryMap = {
            $slider   : $slider,
            $head     : $slider.find('.spa-chat-head'),
            $toggle   : $slider.find('.spa-chat-head-toggle'),
            $title    : $slider.find('.spa-chat-head-title'),
            $sizer    : $slider.find('.spa-chat-sizer'),
            $list_box : $slider.find('.spa-chat-list-box'),
            $msg_log  : $slider.find('.spa-chat-msg-log'),
            $msg_in   : $slider.find('.spa-chat-msg-in'),
            $input    : $slider.find('.spa-chat-msg-in input[type=text]'),
            $send     : $slider.find('.spa-chat-msg-send'),
            $form     : $slider.find('.spa-chat-msg-form'),
            $window   : $(window)
        };
    }
    
    /* calculate and set pixel sizes for elements managed by this module
    */
    function setPxSizes() {
        var opened_height_em,
            px_per_em        = spa.util_brwsr.getEmSize(jqueryMap.$slider.get(0)),
            window_height_em = Math.floor(
                ( jqueryMap.$window.height() / px_per_em ) + 0.5
            );
        
        // compare current window height to configMap threshold,
        // set slider opened height
        opened_height_em = window_height_em > configMap.window_height_min_em ?
            window_height_em - 4 : configMap.slider_opened_min_em;
        
        stateMap.px_per_em = px_per_em;
        stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
        stateMap.slider_opened_px = opened_height_em * px_per_em;
        jqueryMap.$sizer.css({
            height: (opened_height_em - 2) * px_per_em
        });        
    }
    
    
    /* ========================== EVENT HANDLERS =========================== */
    
    /* event handler to change URI anchor.
     * spa.shell.js deals with subsequent 'hashchange' event
    */
    function onTapToggle(event) {
        var set_chat_anchor = configMap.set_chat_anchor;
        if (stateMap.position_type === 'opened') {
            set_chat_anchor('closed');
        } else if (stateMap.position_type === 'closed') {
            set_chat_anchor('opened');
        }
        return false;
    }
    
    
    /* event handler for user-generated event when submitting a message to
     * send. Use the mode.chat.send_msg method to send the message.
    */
    function onSubmitMsg(event) {
        var msg_text = jqueryMap.$input.val();
        
        if (msg_text.trim() === '') { return false; }
        
        configMap.chat_model.send_msg(msg_text);
        jqueryMap.$input.focus();
        jqueryMap.$send.addClass('spa-x-select');
        setTimeout(
            function() {
                jqueryMap.$send.removeClass('spa-x-select');
            },
            250
        );
        return false;
    }
    
    
    /* handler for user-generated event when the click or tap on a person name.
     * Use the model.chat.set_chatee method to set the chatee
    */
    function onTapList(event) {
        var $tapped = $(event.elem_target),
            chatee_id;
        
        if (!$tapped.hasClass('spa-chat-list-name')) { return false; }
        
        chatee_id = $tapped.attr('data-id');
        
        if (!chatee_id) { return false; }
        
        configMap.chat_model.set_chatee(chatee_id);
        
        return false;
    }
    
    
    /* handler for the Model-published event 'spa-setchatee'. Selects the new
     * chatee and deselects the old on. Also changes the chat slider title and
     * notifies the user that the chatee has changed.
    */
    function onSetChatee(event, arg_map) {
        var new_chatee = arg_map.new_chatee,
            old_chatee = arg_map.old_chatee;
        
        jqueryMap.$input.focus();
        
        if (!new_chatee) {
            if (old_chatee) {
                writeAlert(`${old_chatee.name} has left the chat`);
            } else {
                writeAlert('Your friend has left the chat');
            }
            
            jqueryMap.$title.text('Chat');
            return false;
        }
        
        jqueryMap.$list_box
            .find('.spa-chat-list-name')
            .removeClass('spa-x-select')
            .end()
            .find(`[data-id=${arg_map.new_chatee.id}]`)
            .addClass('spa-x-select');
        
        writeAlert(`Now chatting with ${arg_map.new_chatee.name}`);
        jqueryMap.$title.text(`Chat with ${arg_map.new_chatee.name}`);
        return true;
    }
    
    
    /* handler for Model-published 'spa-listchange' events. Get the current
     * people collection and renders the people list, highlighting the chatee.
    */
    function onListChange(event) {
        var list_html = String(),
            people_db = configMap.people_model.get_db(),
            chatee    = configMap.chat_model.get_chatee();
        
        people_db().each(function (person, idx) {
            var select_class = '';
            
            if (person.get_is_anon() || person.get_is_user()) {
                return true;
            }
            
            if (chatee && chatee.id === person.id) {
                select_class = 'spa-x-select';
            }
            
            list_html += `<div class="spa-chat-list-name ${select_class}"
                              data-id="${person.id}">
                            ${spa.util_brwsr.encodeHtml(person.name)}
                         </div>`;
        });
        
        if (!list_html) {
            list_html = `<div class="spa-chat-list-note">
                            To chat alone is the fate of all great souls...
                            <br><br>
                            No one is online
                         </div>`;
            clearChat();
        }
        jqueryMap.$list_box.html(list_html);
    }
    
    
    /* handler for Model-published 'spa-updatechat' events. Updates the display
     * of the message log. If the message originator is the user, clears and
     * refocusesthe input area. Also set the chatee to the sender of the
     * message.
    */
    function onUpdateChat(event, msg_map) {
        var is_user,
            sender_id = msg_map.sender_id,
            msg_text  = msg_map.msg_text,
            chatee    = configMap.chat_model.get_chatee() || {},
            sender    = configMap.people_model.get_by_cid(sender_id);
        
        if (!sender) {
            writeAlert(msg_text);
            return false;
        }
        
        is_user = sender.get_is_user();
        
        if (!(is_user || sender_id === chatee.id)) {
            configMap.chat_model.set_chatee(sender_id);
        }
        
        writeChat(sender.name, msg_text, is_user);
        
        if (is_user) {
            jqueryMap.$input.val('');
            jqueryMap.$input.focus();
        }
    }
    
    
    /* handler for Model-published 'spa-login' events. Opens the chat slider.
    */
    function onLogin(event, login_user) {
        configMap.set_chat_anchor('opened');
    }
    
    
    /* handler for Model-published 'spa-logout' events. Clears the chat slider
     * message log, resets the chat slider title, and closes the chat slider.
    */
    function onLogout(event, logout_user) {
        configMap.set_chat_anchor('closed');
        jqueryMap.$title.text('Chat');
        clearChat();
    }
    
    
    /* ========================== PRIVATE METHODS ========================== */
    
    // provide smooth scrolling of the message log as text appears
    function scrollChat() {
        var $msg_log = jqueryMap.$msg_log;
        
        $msg_log.animate(
            {
                scrollTop : $msg_log.prop('scrollHeight') - $msg_log.height()
            },
            150
        );
    }
    
    
    // method to append to the message log. If the author is the user, use a
    // different style
    function writeChat(person_name, text, is_user) {
        var msg_class,
            name_html,
            text_html;
        
        msg_class = is_user ? 'spa-chat-msg-log-me' : 'spa-chat-msg-log-msg';
        
        name_html = spa.util_brwsr.encodeHtml(person_name);
        text_html = spa.util_brwsr.encodeHtml(text);
        
        jqueryMap.$msg_log
            .append(`
                <div class="${msg_class}">${name_html}: ${text_html}</div>`
            );
        
        scrollChat();
    }
    
    
    // method to append system alerts to the message log.
    function writeAlert(alert_text) {
        jqueryMap.$msg_log
            .append(`
                <div class="spa-chat-msg-log-alert">
                    ${spa.util_brwsr.encodeHtml(alert_text)}
                </div>`
            );
        
        scrollChat();
    }
    
    
    // clear the message log
    function clearChat() {
        jqueryMap.$msg_log.empty();
    }
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* removeSlider
    
       Purpose: removes chatSlider DOM element, reverts to initial state, and
                removes pointers to callbacks and other data
       Arguments : none
       Returns   : true
       Throws    : none
    */
    function removeSlider() {
        // unwind initialization and state
        // remove DOM container; this removes event bindins too
        if (jqueryMap.$slider) {
            jqueryMap.$slider.remove();
            jqueryMap = {};
        }
        stateMap.$append_target = null;
        stateMap.position_type = 'closed';
        
        // unwind key configurations
        configMap.chat_model      = null;
        configMap.people_model    = null;
        configMap.set_chat_anchor = null;
        
        return true;
    }
    
    
    /* handleResize - called by spa.shell.js 'onResize' event handler
    
       Purpose : Given a window resize event, adjust the presentation provided
                 by this module if needed
       Actions : If window height or width falls below threshold, resize the
                 chat slider for the reduced window size
       Returns :
         * true  - resize considered
         * false - resize not considered
       Throws  : none
    */
    function handleResize() {
        
        // do nothing if we don't have a slider container
        if (!jqueryMap.$slider) { return false; }
        
        // recalculate pixel sizes each time handleResize is called
        setPxSizes();
        
        // resize opened slider height 
        if (stateMap.position_type === 'opened') {
            jqueryMap.$slider.css({ height : stateMap.slider_opened_px });
        }
        
        return true;
        
    }
    
    
    /* configModule - uses: 'spa.util.setConfigMap' utility method
    
       Example use : spa.chat.configModule({ slider_open_em: 18 });
       Purpose     : Configure the module prior to initialization
       Arguments   :
         * set_chat_anchor - a callback to modify the URI anchor to indicate
           opened or closed state. This callback must return false if the
           requested state cannot be met
         * chat_model - the chat model object which provides methods to
           interact with our instant messaging
         * people_model - the people model object which provides methods to
           manage the list of people the model maintains
         * slider_* settings. All these are optional scalars.
           See mapConfig.settable_map for a full list.
           Example: slider_open_em is the open height in em's
       Action  :
         The internal configuration data structure (configMap) is updated
         with provided arguments.
       Returns : true
       Throws  : JavaScript error object and stack trace on unacceptable or
                 missing arguments
    */
    function configModule(input_map) {
        spa.util.setConfigMap({
            input_map    : input_map,
            settable_map : configMap.settable_map,
            config_map   : configMap
        });
        return true;
    }
    
    
    /* setSliderPosition
    
       Example use : spa.chat.setSliderPosition( 'closed' );
       Purpose     : Ensure chat slider is in the requested state
       Arguments   :
         * position_type - enum('closed', 'opened', or 'hidden')
         * callback - optional callback at the end of animation.
           (callback receives the slider DOM element as an argument)
       Action  :
         Leaves slider in current state if it matches requested, otherwise
         animate to requested state.
       Returns :
         * true  - requested state achieved
         * false - requested state not achieved
       Throws  : none
    */
    function setSliderPosition(position_type, callback) {
        
        var height_px, animate_time, slider_title, toggle_text;
        
        // 'opened' not allowed if anon user. Returns 'false'; the shell will
        // fix the URI and try again
        if (position_type === 'opened' &&
            configMap.people_model.get_user().get_is_anon()) {
            return false;
        }
        
        // return true if slider already in requested position
        if (stateMap.position_type === position_type) {
            
            // focus on the input box when the slider is opened
            if (stateMap.position_type === 'opened') {
                jqueryMap.$input.focus();
            }
            
            return true;
        }
        
        // set animation parameters based on position_type param
        switch (position_type) {
            case 'opened':
                height_px    = stateMap.slider_opened_px;
                animate_time = configMap.slider_open_time;
                slider_title = configMap.slider_opened_title;
                toggle_text  = '=';
                jqueryMap.$input.focus();
                break;
                
            case 'hidden':
                height_px    = 0;
                animate_time = configMap.slider_open_time;
                slider_title = '';
                toggle_text  = '+';
                break;
                
            case 'closed':
                height_px    = stateMap.slider_closed_px;
                animate_time = configMap.slider_close_time;
                slider_title = configMap.slider_closed_title;
                toggle_text  = '+';
                break;
                
            default:
                // fail on unknown position_type
                return false;
        }
        
        // animate slider position change
        stateMap.position_type = '';
        jqueryMap.$slider.animate(
            { height : height_px },
            animate_time,
            function() {
                jqueryMap.$toggle.prop('title', slider_title);
                jqueryMap.$toggle.text(toggle_text);
                stateMap.position_type = position_type;
                if (callback) { callback(jqueryMap.$slider); }
            }
        );
        return true;        
    }
    
    
    /* initModule
    
       Example use : spa.chat.initModule( $('#div_id') );
       Purpose     : Directs Chat to offer its capability to the user
       Arguments   :
         * $append_target - the jQuery DOM container for this feature module.
           Example: $('#div_id)
       Action     : Appends the chat slider to the provided container and
                    fills it wiht HTML content. It then initializes elements,
                    events, and handlers to provide the user with a chat-room
                    interface
       Returns    : true on success, false on failure
       Throws     : none
    */
    function initModule($append_target) {
        
        var $list_box;
        
        // load chat slider html & jquery cache
        stateMap.$append_target = $append_target;
        
        // append updated slider template to container specified by caller
        $append_target.append( configMap.main_html );
        
        setJqueryMap();
        setPxSizes();
        
        // init chat slider to default title & state
        jqueryMap.$toggle.prop('title', configMap.slider_closed_title);
        stateMap.position_type = 'closed';
        
        // Have $list_box subscribe to jQuery global events
        $list_box = jqueryMap.$list_box;
        $.gevent.subscribe($list_box, 'spa-listchange', onListChange);
        $.gevent.subscribe($list_box, 'spa-setchatee',  onSetChatee);
        $.gevent.subscribe($list_box, 'spa-updatechat', onUpdateChat);
        $.gevent.subscribe($list_box, 'spa-login',      onLogin);
        $.gevent.subscribe($list_box, 'spa-logout',     onLogout);
        
        // bind user input events
        jqueryMap.$head.bind('utap', onTapToggle);
        jqueryMap.$list_box.bind('utap', onTapList);
        jqueryMap.$send.bind('utap', onSubmitMsg);
        jqueryMap.$form.bind('submit', onSubmitMsg);
        
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        setSliderPosition : setSliderPosition,
        configModule      : configModule,
        initModule        : initModule,
        removeSlider      : removeSlider,
        handleResize      : handleResize
    };

}(jQuery));
