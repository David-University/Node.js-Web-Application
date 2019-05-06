
//Flickr Keys
let API_KEY = "api_key=dc140afe3fd3a251c2fdf9dcd835be5c"
let interestingStr = "https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&format=json&nojsoncallback=1&per_page=20" + "&"+API_KEY;


//global variables
let photos = [];    //photos buffer for all the thumbnails
let photosbuff = []; // last 5 photo's buffer
let nrequests;  //photo requests
let nreceived;  //how many photos have been received
let startfinished = 0; // used to prevent search button from overriding starting pictures


//Document ready    
$(function(){   
        
    $.get(interestingStr,function(data){ //call the flickr interesting api
        fetchPhoto(data); //display the incoming data
    });
    
    //Handler and register setup
    search_Register();
    close_modal();
    link_Register();
    modal_uploader();
    interestingphoto();
    clickOffModal();
});
    

//Link Register, sets up the buttons on the left side so that clicking them
//calls the search api with the buttons text value
function link_Register(){
    $('.link').each(function(index){
        $(this).click(function(){
            //grab the value of the button pressed
            let str = $(this).text();
            //flickr api search string
            let searchStr = "https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&"+API_KEY+ "&tags="+str +"&safe_search=3";
            //update currently viewing text
            $('#showing').text(str);
            
            // use search value to find matching photos
            $.get(searchStr,function(data){ 
                
                $('#showing').text()
                photos = []; // empty the photo array
                nrequests = data.photos.photo.length;
                if (nrequests>10){ // limits number of photos to 10 if number of results is greater than 10
                    nrequests = 10;
                }
                nreceived = 0;
                
                for (let i = 0; i<nrequests;i++){
                    let photoObj = {id: data.photos.photo[i].id, title: data.photos.photo[i].title}; 
                    photos.push(photoObj);
                    getSizes(photoObj);
                    
                }
            });
        });
    });
}


// Reads the value within the text field when the search button is clicked
// and calls the flickr search api.
function search_Register(){
    $("#searchBtn").click(function(){
        if(startfinished==1){ // only allows search button to run if the initial loading of interesting pictures has finished
            
            let str = $("#searchbar").val(); // value in search field
            //flickr api search string
            let searchStr = "https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1&"+API_KEY+ "&tags="+str;
            //update currently viewing text to show search term
            $('#showing').text('"' + str + '"' + "\n" + "Search Results");
            
            // use search value to find matching photos
            $.get(searchStr,function(data){ 
                photos = []; // empty the photo array
                nrequests = data.photos.photo.length; // set how many photos are in data
                if (nrequests>10){ // limits number of photos to 10 if number of results is greater than 10
                    nrequests = 10;
                }
                nreceived = 0; //clear received
                
                for (let i = 0; i<nrequests;i++){ //iterate through each photo and store its data and call getSize function to get photo sizes
                    let photoObj = {id: data.photos.photo[i].id, title: data.photos.photo[i].title}; 
                    photos.push(photoObj); //append photoObj to photos array
                    getSizes(photoObj); //get the size of the current photoObj
                }
            });
        }
    });
}


//Displays all photos present within the given photos object
function display(photoslist){
    let htmlStr = ""; //empty html string
         for (let i = 0; i<photoslist.length;i++){ //iterate through the photolist and append each photo with the correct atrributes to the htmlstr
             htmlStr += `<figure class="thumb" user-id="${photoslist[i].owner}" pid="${photoslist[i].id}" data-full="${photoslist[i].full}" data-width="${photoslist[i].width}" data-height="${photoslist[i].height}" data-title="${photoslist[i].title}"><img src="${photoslist[i].file}" alt="${photoslist[i].title}" class="portrait" height="220" width="220"></figure>`;
         }
        $("#item2").html(htmlStr); //update HTML with htmlstr
        register_Thumb();   //register the thumbnails
}


//Displays all recent photos present within the photos object
function displayrec(buff){
    let htmlStr = ""; //empty html string
         for (let i = 0; i<buff.length;i++){ //iterate through the photolist and append each photo with the correct atrributes to the htmlstr
             htmlStr += `<figure class="rec" data-full="${buff[i].full}" pid="${buff[i].id}" data-width="${buff[i].width}" data-height="${buff[i].height}" data-title="${buff[i].title}"><img src="${buff[i].file}" alt="${buff[i].title}" height="110" width="110"></figure>`;
         }
        $("#rimg").html(htmlStr); //update HTML with htmlstr
        register_Rec(); //register the recent thumbnails
}


//Stores the data from the given flickr photo obj in a proper format for getSizes function, contains id and title
function fetchPhoto(data){
    photos = []; // empty the photo array
    
    nrequests = data.photos.photo.length;
    
    if (nrequests>10){ // limits number of photos to 10 if number of results is greater than 10
            nrequests = 10;
    }
    nreceived = 0;
    for(let i=0;i<nrequests;i++){
        let photoObj = {id: data.photos.photo[i].id, title: data.photos.photo[i].title};

        photos.push(photoObj);
        getSizes(photoObj);
    }
}


//Grabs the largest photo URL available from each photo in photo obj and stores in a new parameter file
function getSizes(photoObj){
    
    
    let getSizesStr = "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&format=json&nojsoncallback=1&"+API_KEY+"&photo_id="+photoObj.id;
    $.get(getSizesStr, function(data){
        
        nreceived++; //increment received counter
        
        //Search for sizes "Small" and "Large"
        let small = false;
        let large = false;

        for(let i = 0; i<data.sizes.size.length;i++){ // search entire size array
            if(data.sizes.size[i].label == "Small"){
                photoObj.file = data.sizes.size[i].source;
                small = true;
            }
            if(data.sizes.size[i].label == "Large"){
                photoObj.full = data.sizes.size[i].source;
                //store the width and height
                photoObj.width = data.sizes.size[i].width; 
                photoObj.height = data.sizes.size[i].height; 
                large = true;
            }
        }

        if (!small){ // check if small was unavailable
            photoObj.file = data.sizes.size[0].source;
        }
        
        if (!large){ // check if large was unavailable
            photoObj.full = data.sizes.size[data.sizes.size.length-1].source;
            //store the width and height
            photoObj.width = data.sizes.size[data.sizes.size.length-1].width; 
            photoObj.height = data.sizes.size[data.sizes.size.length-1].height; 
        }

        if (nreceived==nrequests){ // Only call display when all requests have returned
            display(photos);
            startfinished=1;
        }
    });
    
}


//Accepts a photo buffer and index for which photo was selected.
// Resizes the image in the modal to fit within constraints
function modalSizer(buff,index){
    
    //Create modal image with correct width and height
    let width = Number(buff[index].width);
    let height = Number(buff[index].height);
    
    //Compares the heights and widths and sets the minimums accordingly
    if(width>height){
        $('#modal-content').css('min-height','0');
        $('#modal-content').css('min-width','60%');

    }else if(height>width){
        $('#modal-content').css('min-width','0');
        $('#modal-content').css('min-height','60%');
    }else{
        $('#modal-content').css('min-width','0');
        $('#modal-content').css('min-height','60%');
    }
}


//Registers each thumbnail and sets up the click handler for the thumbnails
function register_Thumb(){
    $('.thumb').each(function(index){
        $(this).click(function(){
            //set modal display to visible flex
            $('#modal-container').css('display','flex');
            $('#modal-content').attr('src', $(this).attr('data-full')); // set attribute to src of clicked thumbnail
            $('#modal-caption').text($(this).attr('data-title'));
            
            //Set modal content size
            modalSizer(photos,index);
        
            //Grab its uploader id
            let id = $(this).attr('pid');
            
            //flickr photos getinfo
            let getInfoStr = "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&format=json&nojsoncallback=1&"+API_KEY+"&photo_id="+id;
            
            //Calls flickr function photos.getInfo to get the userID and Username
            $.get(getInfoStr, function(data){
                $('#uploader').text(data.photo.owner.username);
                $("#public").text(data.photo.owner.nsid);
            });
            
            
            //search for matching id in recent list
            let check = false; // initial value of check

            for(let i=0; i<photosbuff.length;i++){ //checks if id is in recent list already
                if (photosbuff[i].id === photos[index].id){ // match found
                    check = true; //set check value
                    break;
                }
            }
            
            if (check == false){ // check if there was an id match, if not added item to list
                photosbuff.unshift(photos[index]); // pushes the selected photo based on index to the recent photo buffer   
        
                if(photosbuff.length>5){ // if buffer is larger than 5, remove end element
                     photosbuff.pop(); //remove last element
                }
                displayrec(photosbuff); //display the added content
            }
        });
    });
}


//Registers recently clicked photos
function register_Rec(){
    $('.rec').each(function(index){
        
        $(this).click(function(){
            //set modal to visible flex
            $('#modal-container').css('display','flex');
            $('#modal-content').attr('src', $(this).attr('data-full')); // set attribute to src of clicked thumbnail
            $('#modal-caption').text($(this).attr('data-title'));
            
            //Set modal content size
            modalSizer(photosbuff,index);

            //Grab its uploader id
            
            let id = $(this).attr('pid');
            
            //flickr photos getinfo
            let getInfoStr = "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&format=json&nojsoncallback=1&"+API_KEY+"&photo_id="+id;
            
            //Calls flickr function photos.getInfo to get the userID and Username
            $.get(getInfoStr, function(data){
                photosbuff[index].username = data.photo.owner.username;
                //set username and user id on the modal
                $('#uploader').text(data.photo.owner.username);
                $("#public").text(data.photo.owner.nsid);
            });
        });
    });
}


//setup function for closing the modal when the region outside of the modal is clicked
function clickOffModal(){
    $('#modal-container').click(function(event){
        let target = $(event.target);
        if(target.is("#modal-content") || target.is('#modal-text') || target.is('#modal-caption') || target.is('#modal-uploader') || target.is('#public')){
            //abort, target was modal
        }else{  //target outside of modal region
            //close modal
            $('#modal-container').css('display','none');
            $('#modal-content').attr('src', '');
            $('#uploader').text("...");
            $("#public").text("");
        }
    });
}


//setup function for the close button in the modal screen
function close_modal(){
    $('#modal-close').click(function(){
        $('#modal-container').css('display','none');
        $('#modal-content').attr('src', '');
        $('#uploader').text("...");
        $("#public").text("");
    });
}


//setup function to detect when the username has been clicked in the modal screen
function modal_uploader(){
    $('#uploader').click(function(){

        let str = $('#uploader').text(); //grabs username from the button
        
        if (str == "..."){ //check if uploader string is empty
            //checks if no username was present
        }else{ //username was not empty

            // get users public photos
            
            if($("#public").text() == ""){ //check if public id is blank
                //abort 
            }else{
                //sets the current viewing box to show the username
                $('#showing').text('"'+$('#uploader').text() + '"' + "\n" + "Photos");
                //string for calling people.getPublicPhotos function
                let getPubPhotosStr = "https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&format=json&nojsoncallback=1&"+API_KEY+"&user_id="+$("#public").text();
                
                //flickr people.getPublicPhotos 
                $.get(getPubPhotosStr, function(data){ // grabs the users public photos
                    fetchPhoto(data); //display the incoming data
                });
                
                //close modal
                $('#modal-container').css('display','none');
                $('#modal-content').attr('src', '');
                $('#uploader').text("...");
                $("#public").text("");
            }
        }
    });
}


//Sets up click handler for interesting photo button
function interestingphoto(){
     $('#interesting').click(function(){
        //change currently viewing text
        $('#showing').text('Interesting Photos');
        $.get(interestingStr,function(data){ //call flickr.interesting api for interesting photos
            fetchPhoto(data); //display the incoming data
        });
     });
}
