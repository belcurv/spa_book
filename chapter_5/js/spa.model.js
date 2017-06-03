/* spa.model.js
   Model module
*/

/* jshint esversion:6 */
/* globals TAFFY, jQuery, spa */

spa.model = (function ($) {
    
    'use strict';
    
    /* =============================== SETUP =============================== */
    
    var configMap = {
            anon_id : 'a0'
        },
        
        stateMap = {
            anon_user      : null,    // reserve for anon person object
            cid_serial     : 0,       // serial# used to create a client ID
            people_cid_map : {},      // reserve for obj of persons keyed by ID
            people_db      : TAFFY(), // init empty TaffyDB people collection
            user           : null     // the current users 'person' object
        },
        
        isFakeData = true,  // use our Fake module instead of real server/db
        
        personProto, makeCid, clearPeopleDb, completeLogin, makePerson,
        removePerson, people, initModule;
    
    
    /* ========================= PEOPLE OBJECT API =========================
    
       The people object is available at: spa.model.people.
       The people object provides methods and events to manage a collection
       of person objects. Its public methods include:
         * get_user() - return the current user person object.
           If the current user is not signed-in, an anonymous person object
           is returned.
         * get_db() - return the TaffyDB database of all ther person objects,
           including the current user, presorted.
         * get_by_cid(<client_id>) - return a person object with the provided
           unique id.
         * login(<user_name>) - login as the user with the provided user name.
           The current user object is changed to reflect the new identity.
           Successful completion of login publishes a 'spa-login' global custom
           event.
         * logout() - revert the current user objec to anonymous. Method
           publishes a 'spa-logout' global custom event.
        
       jQuery global custom events published by the object include:
         * spa-login - this is published when a user login process completes.
           The updated user object is provided as data.
         * spa-logout - this is published when a logout completes. The former
           user object is provided as data.
           
       Each person is represented by a person object.
       Person objects provide the following methods:
         * get_is_user() - returns true if the object is the current user
         * get_is_anon() - returns true if the object is anonymous
         
       The attributes for a person object include:
         * cid - string client id. This is always defined, and is only
           different from the 'id' attribute if the client data is not synced
           with the backend.
         * id - the unique id. This may be undefined if the object is not
           synced with the backend.
         * name - the string name of the user.
         * css_map - a map of attributes used for avatar presentation.
    */
    
    // prototype for 'person' objects
    personProto = {
        get_is_user : function() {
            return this.cid === stateMap.user.cid;
        },
        get_is_anon : function() {
            return this.cid === stateMap.anon_user.cid;
        }        
    };
    
    
    /* generate client ID
       Usually a person object's client ID is the same as the server ID.
       But those created on the client and not yet saved to the backend
       don’t yet have a server ID
    */    
    makeCid = function () {
        return 'c' + String(stateMap.cid_serial += 1 );
    };
    
    
    /* remove all person objects except for the anon person and any
       currently signed-in user object
    */
    clearPeopleDb = function () {
        var user = stateMap.user;
        stateMap.people_db      = TAFFY();
        stateMap.people_cid_map = {};
        if (user) {
            stateMap.people_db.insert(user);
            stateMap.people_cid_map[user.cid] = user;
        }
    };
    
    
    /* complete user sign-in when the backend sends confirmation and data
       for the user. Updates the current user information and then publishes
       the success of the sign-in using a 'spa-login' event.
    */
    completeLogin = function (user_list) {
        var user_map = user_list[0];
        delete stateMap.people_cid_map[user_map.cid];
        stateMap.user.cid     = user_map._id;
        stateMap.user_id      = user_map._id;
        stateMap.user.css_map = user_map.css_map;
        stateMap.people_cid_map[user_map._id] = stateMap.user;
        
        // When we add chat, we should join here
        $.gevent.publish('spa-login', [stateMap.user]);
    };
    
    
    // creates a 'person' object & stores it in a TaffyDB collection
    makePerson = function (person_map) {
        var person,
            cid     = person_map.cid,
            css_map = person_map.css_map,
            id      = person_map.id,
            name    = person_map.name;
        
        if (cid === undefined || !name) {
            throw 'client id and name required';
        }
        
        // create our object from prototype, then add instance-specific props
        person         = Object.create(personProto);
        person.cid     = cid;
        person.name    = name;
        person.css_map = css_map;
        
        if (id) { person.id = id; }
        
        stateMap.people_cid_map[cid] = person;
        
        stateMap.people_db.insert(person);
        return person;
    };

    
    // removes a person object from the people list
    removePerson = function (person) {
        
        // preflight check
        if (!person) {return false; }
        
        // don't return the anonymous person!
        if (person.id === configMap.anon_id) { return false; }
        
        // remove person frm database
        stateMap.people_db({ cid: person.cid }).remove();
        
        
    };
    
    
    
    // define the people object
    people = {
        
        // returns the collection of person objects
        get_db : () => stateMap.people_db,
        
        // returns map of person objects keyed by client ID
        get_cid_map : () => stateMap.people_cid_map
        
    };
    
    
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* initialize module
     *
    */
    initModule = function () {
        var i,
            people_list,
            person_map;
        
        // init anon person
        stateMap.anon_user = makePerson({
            cid  : configMap.anon_id,
            id   : configMap.anon_id,
            name : 'anonymous'
        });
        stateMap.user = stateMap.anon_user;
        
        // if faking it, get collection of online people from Fake module
        // and add them to the 'people_db' TaffyDB collection
        if (isFakeData) {
            people_list = spa.fake.getPeopleList();
            for (i = 0; i < people_list.length; i += 1) {
                person_map = people_list[i];
                makePerson({
                    cid     : person_map._id,
                    css_map : person_map.css_map,
                    id      : person_map._id,
                    name    : person_map.name
                });
            }
        }
    };
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        people     : people,
        initModule : initModule
    };

}(jQuery));