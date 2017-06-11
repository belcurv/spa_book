**Summary**  (pp 225-226)

In this chapter we concluded our work on the Model. We methodically designed, specified, developed, and tested the chat object. As in chapter 5, we used mock data from a Fake module to speed development. We then updated the Chat feature module to use the chat and people object API s provided by the Model. We also created the Avatar feature module, which also used the same API s. We then discussed data binding using jQuery. Finally, we added a Data module that will communicate with the Node.js server using Socket. IO . In chapter 8 we’ll set up the server to work with the Data module. In the next chapter, we’ll get familiar with Node.js.

At the end of Chapter 6 we stopped using our 'fake' backend by switching the boolean to 'false' in `spa.model.js`:

```javascript
spa.model = (function () {
    'use strict';
    var configMap = { anon_id : 'a0' },
        stateMap = {
            ...
        },
        
        isFakeData = false,  // <-- this guy
        ...
```

After that change, when we load our browser document (spa/spa.html) we’ll find our SPA won’t function as before, and we’ll see errors in the console. If we want to continue development without the server, we can easily “flip the switch” and revert the `isFakeData` assignment to true .