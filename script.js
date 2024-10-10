// Store the last appid
let lastAppid = "";

// Store the reviews
let reviews = [];

// Function that is called when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	// If the page is opened with an "appid" URL parameter, automatically fill the "game" input with the appid
	let urlParams = new URLSearchParams(window.location.search);
	let appid = urlParams.get("appid");
	if (appid !== null) {
		// Fill the "game" input with the appid
		document.getElementsByName("game")[0].value = appid;
		// Store the last appid
		lastAppid = appid;
		// Send the request to the server
		get_reviews(appid, true, "all");
	}
	// On click of the "submit" button on the form, send the form data to the server
	document.getElementById("submit").addEventListener("click", function (e) {
		// Prevent the default form submission
		e.preventDefault();
		// If the "game" was not provided, prevent the form submission
		if (document.getElementsByName("game")[0].value === "") {
			alert("Please provide a game!");
			return;
		}
		// Send the form data as URL parameters to the server (take the "game", "english-only" and "review-type" values from the form)
		let game = document.getElementsByName("game")[0].value;
		let englishOnly = document.getElementsByName("english-only")[0].checked;
		// let reviewType = document.getElementsByName("review-type")[0].value;
		// If the "game" is a numeric value, set the "appid" to the value of the "game", otherwise its a link, so extract the "appid" from the link
		let appid;
		if (!isNaN(game)) appid = game;
		else appid = game.split("app/")[1].split("/")[0];
		// Store the last appid
		lastAppid = appid;
		// Send the request to the server
		get_reviews(appid, englishOnly);
	});
	// On click of the "sort-by" select, display the reviews
	document.getElementById("sort-by").addEventListener("change", function () {
		refreshReviewsHTML();
	});
	// On click of the "review-type" radio buttons, display the reviews
	document.getElementsByName("review-type").forEach(radio => {
		radio.addEventListener("change", function () {
			refreshReviewsHTML();
		});
	});
	// On click on the "download" button, open a new empty tab witht the reviews in a new tab (in their simple format)
	document.getElementById("download").addEventListener("click", function () {
		// Create a new tab with the reviews in a new tab (in their simple format)
		let newTab = window.open();
		newTab.document.write("<html><head><title>Reviews</title></head><body style=\"background-color: black; font-family:'Open Sans', sans-serif; font-size: 14px;\"><div id='reviews-container'>" + getReviewsHTML(true) + "</div></body></html>");
		// Notify that the new document is ready (stop loading)
		newTab.document.close();
	});

});

function refreshReviewsHTML() {
	let reviewsHTML = getReviewsHTML();
	document.getElementById("reviews-container").innerHTML = reviewsHTML;
}

function get_reviews(appid, english_only = true) {
	// API url
	let apiURL = "https://panecaldoaldo.pythonanywhere.com/steam_reviews";
	// Construct the URL parameters ("appid", "english_only", "review_type")
	let urlParams = new URLSearchParams();
	// Append the URL parameters
	urlParams.append("appid", appid.toString());
	urlParams.append("english_only", english_only.toString());
	// urlParams.append("review_type", review_type.toString());
	// Fetch the API URL with the URL parameters
	let requestURL = apiURL + "?" + urlParams.toString();
	console.log("Sending request: " + requestURL);
	fetch(requestURL)
		.then(response => response.json())
		.then(data => {
			// Display the data in the "response" div
			console.log("> Found " + data.length + " reviews");
			// Store the reviews
			reviews = data;
			// Display the reviews
			refreshReviewsHTML();
		});
}

// Function to display the reviews
function getReviewsHTML(simpleFormat = false) {
	/*
	{
		"recommendationid": "176074338",
		"author": {
			"steamid": "76561199199077897",
			"num_games_owned": 0,
			"num_reviews": 3,
			"playtime_forever": 403,
			"playtime_last_two_weeks": 158,
			"playtime_at_review": 301,
			"last_played": 1727744100
		},
		"language": "english",
		"review": "funny dice, many many dots. Scaling goes insane. Much big numerals. Going for 100e",
		"timestamp_created": 1727677994,
		"timestamp_updated": 1727677994,
		"voted_up": true,
		"votes_up": 0,
		"votes_funny": 0,
		"weighted_vote_score": 0,
		"comment_count": 0,
		"steam_purchase": true,
		"received_for_free": false,
		"written_during_early_access": false,
		"hidden_in_steam_china": true,
		"steam_china_location": "",
		"primarily_steam_deck": false
	}
	*/
	// Auxiliary function to get a review given the username, data, recommended bool value and text
	function get_review_element(username, date, recommended, text, number) {
		/*
		 <div class="review">
			<div>
				<div class="username">@username</div>
				<div>
					<div class="date">10-01-2024</div>
					<div class="recommended positive"></div>
				</div>
			</div>
			<div>
				Lorem Ipsum è un testo segnaposto utilizzato nel settore della tipografia e della stampa. Lorem Ipsum è considerato il testo segnaposto standard sin dal sedicesimo secolo, quando un anonimo tipografo prese una cassetta di caratteri e li assemblò per preparare un testo campione. È sopravvissuto non solo a più di cinque secoli, ma anche al passaggio alla videoimpaginazione, pervenendoci sostanzialmente inalterato. Fu reso popolare, negli anni ’60, con la diffusione dei fogli di caratteri trasferibili “Letraset”, che contenevano passaggi del Lorem Ipsum, e più recentemente da software di impaginazione come Aldus PageMaker, che includeva versioni del Lorem Ipsum.
			</div>
			</div>
		*/
		// Create the review element
		let reviewElement = document.createElement("div");
		reviewElement.classList.add("review");
		// Create the first div element
		let firstDivElement = document.createElement("div");
		// Create the username element
		let usernameElement = document.createElement("a");
		usernameElement.classList.add("username");
		usernameElement.href = "https://steamcommunity.com/profiles/" + username;
		usernameElement.target = "_blank";
		usernameElement.innerHTML = "@" + username;
		// Create the date and recommended elements
		let dateRecommendedElement = document.createElement("div");
		let dateElement = document.createElement("div");
		dateElement.classList.add("date");
		dateElement.innerHTML = date;
		let recommendedElement = document.createElement("a");
		recommendedElement.classList.add("recommended");
		recommendedElement.classList.add(recommended ? "positive" : "negative");
		recommendedElement.href = "https://steamcommunity.com/profiles/" + username + "/recommended/" + lastAppid + "/"
		recommendedElement.target = "_blank";
		// Append the date and recommended elements
		dateRecommendedElement.appendChild(dateElement);
		dateRecommendedElement.appendChild(recommendedElement);
		// Create the text element
		let textElement = document.createElement("p");
		textElement.classList.add("text");
		// Convert the text to HTML with also newlines, spaces, tabs, etc.
		text = text.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
		let text_lines = text.split("\n");
		text = "<span>" + text_lines.join("</span><br/><span>") + "</span>";
		if (simpleFormat) {
			// Add an additional line with the reviews information (text "N) Recommended on DD-MM-YYYY")
			let recommendedText = recommended ? "Recommended" : "NOT Recommended";
			// text = "<p><b>" + number + " | " + recommendedText + "</b> (" + date + ")</p><p>" + text + "</p>";
			text = "<p><b>" + number + " | <a style='all: unset; text-decoration: underline; cursor:pointer;' href='https://steamcommunity.com/profiles/" + username + "' target='_blank'>" + recommendedText + "</a></b> <span style='opacity: 0.3;'>(" + date + ")</span></p><p>" + text + "</p>";
			// Add a dim background color based on the recommendation
			reviewElement.style.color = "white";
			reviewElement.style.backgroundColor = recommended ? "#00ff0030" : "#ff000040";
			reviewElement.style.padding = "0.1em 1em";
			reviewElement.style.borderRadius = "0.5em";
			reviewElement.style.marginBottom = "0.25em";
		}
		textElement.innerHTML = text;
		// Append the username, date and recommended elements
		firstDivElement.appendChild(usernameElement);
		firstDivElement.appendChild(dateRecommendedElement);
		// Append the first div element and the text element
		if (!simpleFormat) reviewElement.appendChild(firstDivElement);
		reviewElement.appendChild(textElement);
		return reviewElement;
	}
	// Display the reviews in the "reviews" div
	// let reviewsElement = document.getElementById("reviews-container");
	// Get the current sorting criteria
	let sortingCriteria = document.getElementById("sort-by").value;
	// Get the current review type to display
	let reviewType = document.getElementsByName("review-type")[0].value;
	// Sort the reviews based on the sorting criteria (either "recent" or "oldest")
	if (sortingCriteria === "recent") {
		reviews.sort((a, b) => b["timestamp_created"] - a["timestamp_created"]);
	} else {
		reviews.sort((a, b) => a["timestamp_created"] - b["timestamp_created"]);
	}
	// // Clear the reviews
	// reviewsElement.innerHTML = "";
	let htmlToReturn = "";
	// Display each review
	for (let i = 0; i < reviews.length; i++) {
		// Get the current review
		let review = reviews[i];
		// Check if the review type matches
		if (reviewType === "positive" && !review["voted_up"]) continue;
		if (reviewType === "negative" && review["voted_up"]) continue;
		// Get the review elements
		let date = new Date(review["timestamp_created"] * 1000).toLocaleDateString();
		let formattedDate = date.split("/").join("-");
		let reviewElement = get_review_element(review["author"]["steamid"], formattedDate, review["voted_up"], review["review"], i + 1);
		// Append the review element
		// reviewsElement.appendChild(reviewElement);
		htmlToReturn += reviewElement.outerHTML;
	}
	return htmlToReturn;
}
