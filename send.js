$(function(){
    ///VARIABLES///
    const socket = io.connect();

    //containers
    const $main = $('.main');
    const $msgForm = $('#msgForm');
    const $msgField = $('#messField');
    const $loginWarningText = $('#warning');
    const $createChatWarningText = $('#chatWarning');
    const $chat_list = $("#chat_list");
    let $addChatWarningText;
    let $createChatForm;
 
    //inputs / buttons
    const $inputVerificationLogin = $('#input_login');
    const $inputVerificationPass = $('#input_password');
    const $btnVerificationSignIn = $('#signIn');
    const $btnVerificationLogIn = $('#logIn');
    const $btnVerificationSubmit = $('#log__submit');
    let $inputAddChatID;
    let $inputAddChatPass;
    let $inputMsgForm;
    let $inputCreateChatName;
    let $inputCreateChatPass;
    let $btnAddChat;
    let $btnCreateChatSubmit;
    let $btnDeleteCookie;
    let $btnMsgForm;
    

    //other
    const validChars = ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'E', 'f', 'F', 'g', 'G', 'h', 'H', 'i', 'I', 'j', 'J', 'k', 'K', 'l', 'L', 'm', 'M', 'n', 'N', 'o', 'O', 'p', 'P', 'q', 'Q', 'r', 'R', 's', 'S', 't', 'T', 'u', 'U', 'v', 'V', 'w', 'W', 'x', 'X', 'y', 'Y', 'z', 'Z', 'а', 'А', 'б', 'Б', 'в', 'В', 'г', 'Г', 'д', 'Д', 'е', 'Е', 'ё', 'Ё', 'ж', 'Ж', 'з', 'З', 'и', 'И', 'й', 'Й', 'к', 'К', 'л', 'Л', 'м', 'М', 'н', 'Н', 'о', 'О', 'п', 'П', 'р', 'Р', 'с', 'С', 'т', 'Т', 'у', 'У', 'ф', 'Ф', 'х', 'Х', 'ц', 'Ц', 'ч', 'Ч', 'ш', 'Ш', 'щ', 'Щ', 'ъ', 'Ъ', 'ы', 'Ы', 'ь', 'Ь', 'э', 'Э', 'ю', 'Ю', 'я', 'Я', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' '];
    const numberChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let veryficationType = 0; // 0 - logIn 1 - signIn
    let Name = ($.cookie('name') == null ? '' : $.cookie('name'));
    let chatID = 1;
    let CHATS = [];
    let $offchat;

    ///LOGIC///

    if(Name == ''){
        $btnVerificationLogIn.css({'border-bottom': '1px solid white', 'color': 'white'});

        $btnVerificationSignIn.on('click', (event) => {
            $btnVerificationSignIn.css({'border-bottom': '1px solid white', 'color': 'white'});
            $btnVerificationLogIn.css({'border-bottom': '1px solid #a5a5a5', 'color': '#a5a5a5'});
            $btnVerificationSubmit.val('Sign In');
            veryficationType = 1;
        });
        $btnVerificationLogIn.on('click', (event) => {
            $btnVerificationSignIn.css({'border-bottom': '1px solid #a5a5a5', 'color': '#a5a5a5'});
            $btnVerificationLogIn.css({'border-bottom': '1px solid white', 'color': 'white'});
            $btnVerificationSubmit.val('Log In');
            veryficationType = 0;
        });
        $btnVerificationSubmit.on('click', (event) => {
            event.preventDefault();
            if(checkCorrectInput($inputVerificationLogin.val(), 'login', $loginWarningText) && checkCorrectInput($inputVerificationPass.val(), 'password', $loginWarningText)) sendLogin();
        }); 
    }else {
        onLogin();
    } 
    
    $(document).on('keypress', function(e) {
        if(e.which == 13) {
            e.preventDefault();
            if(Name != "" && $inputMsgForm.val() != "") sendMsg();
            else if(Name == "" && checkCorrectInput($inputVerificationLogin.val(), 'login', $loginWarningText) && checkCorrectInput($inputVerificationPass.val(), 'password', $loginWarningText)) sendLogin();
        }
    });

    ///SOCKET///
    socket.emit('get userData', {login: Name});
/*
    const request = () => {
        return new Promise((resolve, reject) => {
            socket.emit('getKey');
            socket.on('key', (data) => {
                resolve(data); // Resolve the promise with the key
            });
        });
    };

    function rsaEncrypt(text, publicKey){
        let encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);
        return encryptor.encrypt(text);
    }*/

    socket.on('error', function(data) {
        switch(data.type){
            case 'login': {
                $loginWarningText.text(data.message);
                break;
            }
            //case 'get userData' мб когда-нибудь создать им поля для вывода ошибок
            //case 'send message'
            case 'add chat': {
                $addChatWarningText.text(data.message);
                break;
            }
            case 'create chat': {
                $createChatWarningText.text(data.message);
                break;
            }
            default: {
                console.log(data.message);
                break;
            }
        }
    });

    socket.on('veryfication', function(data){//success
        Name = data.name;
        onLogin();
        moveMess();
    }); 

    socket.on('add message', function(data){
        $msgField.append(addMsgHTML(data.login, data.message, data.time));
        $msgField.scrollTop($msgField.height());
    });

    socket.on('all chats', function(data){
        if(data.length != 0) data.forEach(el => {
            createNewChat(el);
        });
    });

    socket.on('last messages', function(data){
        $(`#chat_${chatID}`).css({"background": "transparent", "color": "#b5b3b3", "border": "1px solid #a5a5a5"});
        chatID = data.chatID;
        $msgField.empty();
        data.messages.forEach(item => {
            $msgField.append(addMsgHTML(item.name, item.message, item.time));
        });
        $msgField.scrollTop($msgField.height());
        createNewChat(data);
        $(`#chat_${chatID}`).css({"background": "#22242c", 'color': 'white', "border": "1px solid white"});
    });

    function sendMsg(){
        let time = new Date().getTime();
        if( $.cookie('sendMsg') == null || time - $.cookie('sendMsg') > 500){
            /*request().then((data) => {
                console.log(data);
                let hash = rsaEncrypt('hello world', data.publicKey);
                //JSON.stringify({chatID: chatID, login: Name, message: $inputMsgForm.val(), time: getTime()})
                console.log(hash);
                socket.emit('send message',  {hash: hash});
            }); */
            socket.emit('send message', {chatID: chatID, login: Name, message: $inputMsgForm.val(), time: getTime()});
            $inputMsgForm.val('');
            $.cookie('sendMsg', time, {expires: 2, path: '/'});
            console.log("Message send at: ", time);
        }
    }

    function sendLogin(){
        let time = new Date().getTime();
        //$.removeCookie('login');
        //not exist
        if($.cookie('login') == null) $.cookie('login', JSON.stringify( {try: 0, time: time} ), {expires: 2, path: '/'});

        console.log( $.cookie('login') );
        let cookie = JSON.parse($.cookie('login'));
        console.log(cookie);

        if(cookie.try == 5 && time - cookie.time < 30000) $loginWarningText.text('Too many attempts, try again after 30 seconds');
        else{
            socket.emit('login', {chatID: chatID, login: $inputVerificationLogin.val(), password: CryptoJS.MD5($inputVerificationPass.val()).toString(), type: veryficationType} );
            
            //remove ban
            if(cookie.try == 5 && time - cookie.time > 30000) $.cookie('login',  JSON.stringify( {try: 1, time: time} ), {expires: 2, path: '/'});
            //increase attempts
            else $.cookie('login', JSON.stringify( {try: cookie.try + 1, time: time} ), {expires: 2, path: '/'});
        }
    }
    ///FUNCTIONS///

    function onLogin(){
        socket.emit('get userData', {login: Name});

        $('#log').remove();
        $("#log_wrapper").remove();
        $('.empty').css('display', 'none');
        $loginWarningText.remove();
        $msgForm.css("display", "flex");
        $.cookie('name', Name, {expires: 2, path: '/'});

        $msgForm.append(showVeryfiedHTML());
        $btnMsgForm = $('#msgForm');
        $inputMsgForm = $('#inputMsg');
        $btnMsgForm.on('click', (event) => {
            event.preventDefault();
            if(Name != "" && $inputMsgForm.val() != "") sendMsg();
        }); 

        $main.prepend(showInfoHTML(Name));
        $createChatForm = $('#createChatForm');
        $addChatWarningText = $('#addChatWarning');

        $inputAddChatID = $('#inputAddChatID');
        $inputAddChatPass = $('#inputAddChatPass');
        $inputCreateChatName = $('#inputCreateChatName');
        $inputCreateChatPass = $('#inputCreateChatPass');

        $btnAddChat = $('#btnAddChat');
        $btnDeleteCookie = $('#btnDeleteCookie');
        $btnCreateChatSubmit = $('#btnCreateChatSubmit');

        $createChatForm.css('display', 'flex');

        $btnAddChat.on('click', (event) => {
            event.preventDefault();
            if(checkCorrectInput($inputAddChatID.val(), 'chat id', $addChatWarningText, 'number', [0, 20]) && checkCorrectInput($inputAddChatPass.val(), 'chat password', $addChatWarningText)){
                socket.emit('add chat', {chatID: $inputAddChatID.val(), password: CryptoJS.MD5($inputAddChatPass.val()).toString(), login: Name, time: getTime()});
            }
        });

        $btnCreateChatSubmit.on('click', (event) => {
            event.preventDefault();
            if(checkCorrectInput($inputCreateChatName.val(), 'chat name', $createChatWarningText) && checkCorrectInput($inputCreateChatPass.val(), 'chat password', $createChatWarningText)){
                socket.emit('create chat', {name: $inputCreateChatName.val(), password: CryptoJS.MD5($inputCreateChatPass.val()).toString(), login: Name, time: getTime()});
            }
        });

        $btnDeleteCookie.on('click', (event) => {
            $.removeCookie('name');
            $.removeCookie('login');
            window.location.reload();
            console.log('Cookie deleted');
        });
    }

    function checkCorrectInput(input, inputName, errorOutput, type="text", range=[4, 15]){
        errorOutput.text();
        if(input == "") {
            errorOutput.text(`Please, enter ${inputName}`);
            return false;
        }
        if(input.length < range[0] || input.length > range[1]) {
            errorOutput.text(`The ${inputName} must contain more than ${range[0]-1} and less than ${range[1] + 1} characters`);
            return false;
        }
        if(type == 'text'){
            for(let i = 0; i < input.length; i++){
                if(validChars.indexOf(input[i]) == -1){
                    errorOutput.text(`The ${inputName} can contain only english and russian letters and digits`);
                    return false;
                }
            }
        }else if(type == 'number'){
            for(let i = 0; i < input.length; i++){
                if(numberChars.indexOf(input[i]) == -1){
                    errorOutput.text(`The ${inputName} can contain only digits`);
                    return false;
                }
            }
        }

        return true;
    }

    function createNewChat(data){
        let newChat = {
            id: data.chatID,
            name: data.chatName,
            password: data.chatPassword,
            html: undefined
        };
        let isExistChat = false;
        CHATS.forEach(el => {
            if(el.id == newChat.id){
                isExistChat = true;
                return;
            }
        });
        if(!isExistChat){
            $chat_list.append(addChatHTML(newChat.name, newChat.id));
            newChat.html = $(`#chat_${newChat.id}`);
            newChat.html.on('click', (event) => {
                event.preventDefault();
                $(`#chat_${chatID}`).css({"background": "transparent", "color": "#b5b3b3", "border": "1px solid #a5a5a5"});
                $(`#chat_${newChat.id}`).css({"background": "#22242c", 'color': 'white', "border": "1px solid white"});
                socket.emit('add chat', {chatID: newChat.id, password: newChat.password, login: Name, time: getTime()});
            });
            CHATS.push(newChat);
        }
    }

    function moveMess(){
        $msgField.find("div.messName").each(function() {
            var $this = $(this);
            if($this.text() == Name){
                $this.parent().parent().addClass("mymess");
            }
        })
    }

    function getTime(){
        let date = new Date();
        let day = (date.getDate() < 10 ? '0' : '') + date.getDate();
        let month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
        let year = date.getFullYear();
        let hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
        let minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    ///HTML BLOCKS///

    function showInfoHTML(name){
        return ` <div id="info">
                    <p id="addChatWarning"></p>
                    <div class="info__wrapper">
                        <div class="name_wrapper">
                            <p class="text">Login: ${name}</p>
                        </div>
                        <div id="addchat">
                            <input class="inputREG" type="text" id="inputAddChatID" placeholder="Enter id" autocomplete="off">
                            <input class="inputREG" type="text" id="inputAddChatPass" placeholder="Enter password" autocomplete="off">
                            <div id="btnAddChat">
                                <div class="round">
                                    <p class="arr noselect">></p>
                                </div>
                            </div>
                        </div>
                        <input type="button" id="btnDeleteCookie" value="Log out">
                    </div>
                    
                </div>`
    }

    function addChatHTML(chatName, chatID){
        return `<div class="chats__chat" id="chat_${chatID}">
                    <p class="p_first lowwhite">${chatName}</p>
                    <p class="lowwhite">#${chatID}</p>
                </div>`;
    }

    function addMsgHTML(name, message, time) {
        return `<div class="mess ${(name == Name) ? 'mymess' : ''}">
                    <div class="messWrapper">
                        <div class="messName">${name}</div>
                        <div class="messTime">${time}</div>
                    </div>
                    <div class="messText">${message}</div>
                </div>`;
    }

    function showVeryfiedHTML(){
        return `<input id="inputMsg" type="text" placeholder="Enter message" class="form__field" autocomplete="off">
                    <div id="msgFormBtn">
                        <div class="round2">
                            <p class="arr2 noselect">>></p>
                        </div>
                    </div>
                </div>`;
    }
});