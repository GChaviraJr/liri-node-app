require("dotenv").config()

// npm apps
let Spotify = require('node-spotify-api')
const request = require("request")
const fs = require("fs")
let BandsInTownEvents = require("bandsintown-events")
const XHR2 = require("xhr2")
const moment = require("moment")

// access keys.js to get SPOTIFY and BANDSINTOWN api access
const keys = require("./keys.js")
let spotify = new Spotify(keys.spotify)
let Events = new BandsInTownEvents()

// collect arguments entered into terminal
let infoEntered = process.argv
let action = process.argv[2]

// make data after action (movie title) into a string
let title = ""
if (process.argv[3] !== undefined) {
    for (i = 3; i < infoEntered.length; i++) {
        title += infoEntered[i] + " "
    }
}


// what to do with data entered into terminal
switch (action) {
    case "movie-this":
        movie()
        break;

    case "concert-this":
        concert()
        break;

    case "spotify-this-song":
        spotifyTitle()
        break;

    case "do-what-it-says":
        doIt()
        break;

    default:
        let logDefault = "______________________ DEFAULT - NO ENTRY _______________________" + 
        "\nThis is not a recognized command." +
        "\nPlease enter one of the following commands:" +
        "\n1. To search OMDB for a movie title: node liri.js movie-this <movie title>" + 
        "\n2. To search Spotify for a song title: node liri.js spotify-this-song <song title>" +
        "\n3. To check for band shows in your area: node liri.js concert-this <artist name>" +
        "\n4. For a random search: node liri.js do-what-it-says" +
        "\n*********************************************************************\n"
        console.log(logDefault)
        fs.appendFile("log.txt", logDefault, function (err) {
            if (err) {
                return console.log(err)
            }
        })
}

// *********************** Movie ***************************
// what to do if no movie title specified, splits given title into IMDBapi syntax
function movie() {
    if (process.argv[3] === undefined) {
        title = "Mr.+Nobody"
        movieInfo();
    } else if (title !== undefined) {
        titleSplit = title.split(" ")
        title = titleSplit.join("+")
        movieInfo()
    }
}

// contact OMDBapi for movie info
function movieInfo() {
    var queryURL = "http://www.omdbapi.com/?t=" + title + "&y=&plot=short&apikey=trilogy"

    request(queryURL, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            if (body) {
                var data = JSON.parse(body);
                if (data.Error == 'Movie not found!') {
                    var logNoMovies = "\n********************************** MOVIE THIS **********************************\nOMDB could not find any movies that matched that title.  Please try again.\n********************************************************************************\n"
                    console.log(logNoMovies)
                    fs.appendFile("log.txt", logNoMovies, function (err) {
                        if (err) {
                            return console.log("No movie by that title data did not append to log.txt file.")
                        }
                    })
                } else if (data.Ratings.length < 2) {
                    var logMovies = "\n______________________________MOVIE THIS ___________________________\nTitle: " + data.Title +
                        "\nRelease Year: " + data.Year +
                        "\nIMDB Rating: " + data.imdbRating +
                        "\nRotten Tomatoes Rating: No Rotten Tomatoes Rating\nCountry movie produced in: " + data.Country +
                        "\nLanguage: " + data.Language +
                        "\nPlot: " + data.Plot +
                        "\nActors: " + data.Actors + "\n********************************************************************************\n"
                    console.log(logMovies)
                    fs.appendFile("random.txt", "\r\nmovie-this, "+ title, function (err) {
                        if (err) {
                            return console.log("Movie data did not append to log.txt file.")
                        }
                    })
                    return
                } else if (data.Ratings[1].Value !== undefined) {
                    var logMovies =
                        "\n________________________________________________________________________" +
                        "\n|______________________________ MOVIE THIS ____________________________|" +
                        "\n|Title: " + data.Title + "                                                |" +
                        "\n|Release Year: " + data.Year + "                                                    |" +
                        "\n|IMDB Rating: " + data.imdbRating + "                                                      |" +
                        "\n|Rotten Tomatoes Rating: " + data.Ratings[1].Value + "                                      |" +
                        "\n|Country movie produced in: " + data.Country + "                                     |" +
                        "\n|Language: " + data.Language + "\nPlot: " + data.Plot + "               |" +
                        "\n|Actors: " + data.Actors + "     |" +  
                        "\n|______________________________________________________________________|\n"
                    console.log(logMovies)
                    fs.appendFile("random.txt", "\r\nmovie-this "+ title, function (err) {
                        if (err) {
                            return console.log("Movie data did not append to log.txt file.")
                        }
                    })
                }
            }
        }
        if (error) {
            var logMovieError = "OMDBapi response error. Please try again.\n"
            console.log(logMovieError)
            fs.appendFile("log.txt", logMovieError, function (err) {
                if (err) {
                    return console.log("OMDBapi response error message did not append to log.txt file.")
                }
            })
        }

    })
}

// *********************** Bandsintown ***********************
// Call concert() function
function concert() {
    if (process.argv[3] === undefined) {
        title = "a day to remember"
        concertInfo()
    } else if (title !== undefined) {
        concertInfo()
    }
}

// Bandsintown api call and return info

function concertInfo() {
    let artist = process.argv.slice(3).join(" ")
    let queryURL = "https://rest.bandsintown.com/artists/" + artist + "/events?app_id=" + keys.bandsInTown
    request(queryURL, function (error, response, body) {
        if (error) console.log(error)
        let result = JSON.parse(body)[0]
        let logConcert =
            "\n_____________________Concert This____________________" +
        "\nLineup " + result.lineup +
            "\nVenue Name: " + result.venue.name +
            "\nVenue Location: " + result.venue.city +
            "\nVenue Event Date: " + moment(result.datetime).format("MM/DD/YYYY") +
            "\n**************************************************\n"
        console.log(logConcert)
        fs.appendFile("random.txt", "\r\nconcert-this "+ artist, function (err) {
            if (err) {
                return console.log("Concert data was not appended to the log.txt file.")
            }
        })
    })
}


// *********************** Spotify *************************
// What to do if no title entered or if title splits into spotify syntax
function spotifyTitle() {
    if (process.argv[3] === undefined) {
        title = "The+Sign+Ace+of+Base"
        spotifyInfo()
    } else if (title !== undefined) {
        titleSplit = title.split(" ")
        spotifyInfo()
    };
};

// Spotify api call and return info
function spotifyInfo() {
    spotify.search({
        type: 'track',
        query: title,
        limit: 1,
    }, function (err, data) {
        if (data) {
            var info = data.tracks.items
            var logSpotify =
                "\n___________________SPOTIFY THIS SONG _________________\nArtist: " + info[0].artists[0].name +
                "\nSong title: " + info[0].name +
                "\nAlbum name: " + info[0].album.name +
                "\nURL Preview: " + info[0].preview_url +
                "\n*******************************************************\n"
            console.log(logSpotify)
            fs.appendFile("random.txt", "\r\nspotify-this-song "+ title, function(err) {
                if (err) {
                    return console.log("Spotify song data was not appended to the log.txt file.")
                }
            })
        } else if (err) {
            var logNoSpotify =
                "\n****************************** SPOTIFY THIS SONG *******************************\nSpotify could not find a song with that title. Please try Again.\n********************************************************************************\n"
            console.log(logNoSpotify)
            fs.appendFile("log.txt", logNoSpotify, function (err) {
                if (err) {
                    return console.log("Spotify no song data found was not appended to the log.txt file.")
                }
            })
        }
    })
}

// *********************** Do-What-It-Says **************************
// Read random.txt file and use the data to perform an action 
function doIt() {
    fs.readFile("random.txt", "utf8", function (err, data) {
        if (err) {
            let logDoIt = ("\n************************** Do-What-It-Says *****************************\nThere was a problem reading the random.txt file. Please try again.\n********************************************************************************")
            return console.log(logDoIt)
            fs.appendFile("log.txt", logDoIt, function (err) {
                if (err) {
                    return console.log("do-what-it-says data was not appended to the log.txt file.")
                }
            })
        }

        var output = data.split(",")
        action = output[0]
        process.argv[3] = output[1]
        title = process.argv[3]

        if (action === 'spotify-this-song') {
            spotifyTitle()
        }

    })
}