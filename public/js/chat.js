const socket = io(); 
const $messageFormInput = document.querySelector('#user-mssg');
const $messageFormButton = document.querySelector('#submit');
const $messageForm = document.querySelector('#message-form');
const $sendLocationButton = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages');


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;
    
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (mssg) => {
    console.log(mssg)
    const html = Mustache.render(messageTemplate, {
        username: mssg.username,
        mssg: mssg.text,
        createdAt: moment(mssg.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector("#sidebar").innerHTML= html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    let mssg = $messageFormInput.value
    socket.emit('sendMessage', mssg, (error) => {
        // enable
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value= '';
        $messageFormInput.focus();
        if(error){
            return console.log(error)
        }
        console.log('The message was delivered!')
    });
})

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled');
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        let location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation',location, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared!')
        } )
        socket.on('locationMessage', (message) => {
            console.log(message)
            const html = Mustache.render(locationTemplate, {
                username : message.username,
                url: message.url,
                createdAt : moment(message.createdAt).format('hh:mm a'), 
                location : message.location})
            $messages.insertAdjacentHTML('beforeend',html);
            autoscroll();
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href= './'
    }
})