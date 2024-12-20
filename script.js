// Store the last appid
let lastAppid = "";
// Store the reviews
let reviews = [];
// Store the total clicks count onto the title
let titleClicks = 0;

// Function that is called when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	// If the page is opened with an "appid" URL parameter, automatically fill the "game" input with the appid
	let urlParams = new URLSearchParams(window.location.search);
	let appid = urlParams.get("appid");
	if (appid !== null) {
		// Fill the "game" input with the appid
		document.getElementsByName("game")[0].value = appid;
		// Empty the #debug element
		document.getElementById("debug").innerHTML = "";
		// Reset the title clicks
		titleClicks = 0;
		// Reset the color of the title
		document.getElementById("title").style.color = "white";
		// Send the request to the server
		get_reviews(appid);
	}
	// On click of the "submit" button on the form, send the form data to the server
	document.getElementById("submit").addEventListener("click", function (e) {
		// Prevent the default form submission
		e.preventDefault();
		// If the "game" was not provided, prevent the form submission
		if (document.getElementsByName("game")[0].value === "") {
			alert("Please provide a game ID or store page URL!");
			return;
		}
		// Send the form data as URL parameters to the server (take the "game", "english-only" and "review-type" values from the form)
		let game = document.getElementsByName("game")[0].value;
		// If the "game" is a numeric value, set the "appid" to the value of the "game", otherwise its a link, so extract the "appid" from the link
		let appid;
		if (!isNaN(game)) appid = game;
		else if (game.includes("app/")) appid = game.split("app/")[1].split("/")[0];
		else {
			alert("Invalid game ID or URL!");
			return;
		}
		// Send the request to the server
		get_reviews(appid);
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
	// On click of the "english-only" checkbox, display the reviews
	document.getElementsByName("english-only")[0].addEventListener("change", function () {
		refreshReviewsHTML();
	});
	// On change of the "min-length" number input, display the reviews
	document.getElementById("min-length").addEventListener("change", function () {
		refreshReviewsHTML();
	});
	// On click on the "reader-mode" button, open a new empty tab witht the reviews in a new tab (in their simple format)
	document.getElementById("reader-mode").addEventListener("click", function () {
		// Create a new tab with the reviews in a new tab (in their simple format)
		let newTab = window.open();
		// Get the HTML content to display in the new tab
		let newTabHTML = getSimpleReviewsPageHTML();
		newTab.document.write(newTabHTML);
		// Notify that the new document is ready (stop loading)
		newTab.document.close();
		// Also download the page as an HTML file (if needed)
		let downloadOnCLick = false;
		if (downloadOnCLick) {
			let downloadLink = document.createElement("a");
			downloadLink.href = "data:text/html," + encodeURIComponent(newTabHTML);
			downloadLink.download = "reviews_" + lastAppid + ".html";
			downloadLink.click();
		}
	});
	// On click of the "advanced" button, toggle the advanced options
	document.getElementById("advanced").addEventListener("click", function () {
		// Toggle the advanced options (with class ".advanced-controls") by toggling class "collapsed"
		let advancedOptions = document.querySelector(".advanced-controls");
		advancedOptions.classList.toggle("collapsed");
	});
	// On input on input text element "#filter" filter the reviews based on the text (simply refresh reviews to display the filtered reviews)
	document.getElementById("filter").addEventListener("change", function () {
		refreshReviewsHTML();
	});
	// On change of the "exact-match" checkbox, display the reviews
	document.getElementsByName("exact-match")[0].addEventListener("change", function () {
		refreshReviewsHTML();
	});

	// DEBUG FUNCTIONS: On click N times onto the page title, upload the simplified review file on the server
	let title = document.getElementById("title");
	let clicksNeeded = 5;
	title.addEventListener("click", function () {
		titleClicks++;
		if (titleClicks == clicksNeeded) {
			// Send a request to save the simplified HTML content of the file to the server
			let simplifiedHTML = getSimpleReviewsPageHTML();
			let requestURL = "https://panecaldoaldo.pythonanywhere.com/save";
			let parameters = {
				"content": simplifiedHTML,
				"extension": "html",
			}
			// Set the title to be yellow
			title.style.color = "yellow";
			// Send the request to the server
			console.log("Sending request : " + requestURL);
			fetch(requestURL,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(parameters),
				})
				.then(response => response.json())
				.then(data => {
					// Check the success/failure of the request
					if (data["status"] === "error") {
						console.error("Server Error: " + data["message"]);
						alert("Server Error: " + data["message"]);
						return;
					} else if (data["status"] === "success") {
						console.log("Success: " + data["filename"]);
						// Open the returned URL in a new tab
						filename = data["filename"];
						if (filename.startsWith("./")) filename = filename.substring(2);
						if (filename.startsWith("/")) filename = filename.substring(1);
						let fileURL = "https://panecaldoaldo.pythonanywhere.com/" + filename;
						// Update the content of "#debug" with the file URL
						document.getElementById("debug").innerHTML = "The file has been saved at:<br/><a href='" + fileURL + "' target='_blank'>" + fileURL + "</a>";
						// Open the URL in a new tab
						// let newTab = window.open(fileURL, "_blank");
					} else {
						console.error("Unknown error");
						alert("Unknown error");
					}
				});
		}
	});


	// To all elements with a "tooltip=..." attribute, add a tooltip on hover (using the "#tooltip" element in the HTML)
	let tooltip = document.getElementById("tooltip");
	let tooltipElements = document.querySelectorAll("[tooltip]");
	tooltip.style.display = "none";
	for (let i = 0; i < tooltipElements.length; i++) {
		tooltipElements[i].addEventListener("mouseenter", function (e) {
			// Get the tooltip text
			let tooltipText = e.target.getAttribute("tooltip");
			if (tooltipText === null) return;
			// Check if the tooltip text is different from the previous one
			if (tooltip.innerHTML === tooltipText && tooltip.style.display === "block") return;
			// Set the tooltip text
			tooltip.innerHTML = tooltipText;
			// Display the tooltip
			tooltip.style.display = "block";
		});
		tooltipElements[i].addEventListener("mouseleave", function () {
			tooltip.style.display = "none";
		});
	}
	// Track mouse position and update the tooltip position
	document.addEventListener("mousemove", function (e) {
		let tooltip = document.getElementById("tooltip");
		if (tooltip.style.display === "none") return;
		let tooltipOffset = 10;
		tooltip.style.left = e.clientX + tooltipOffset + "px";
		tooltip.style.top = e.clientY + tooltipOffset + "px";
	});
	// On mouse click on anything, hide the tooltip
	document.addEventListener("click", function () {
		document.getElementById("tooltip").style.display = "none";
	});

});

function getSimpleReviewsPageHTML() {
	// Intruductory text/title
	let showIntroductoryText = true;
	let titleText = "Simplified Steam Reviews";
	let reviewType = document.getElementsByName("review-type")[0].value;
	let sortingCriteria = document.getElementById("sort-by").value;
	let englishOnly = document.getElementsByName("english-only")[0].checked;
	let appIdLinkElement = "<a href='https://store.steampowered.com/app/" + lastAppid + "' target='_blank' style='all:unset; text-decoration: underline; font-weight: bold; cursor:pointer;'>" + lastAppid + "</a>";
	let description = "<b>List of " + reviewType.toString().toUpperCase() + " reviews for the game with appid \"" + appIdLinkElement + "\" (sorted by upload date, " + (sortingCriteria == "recent" ? "descending" : "ascending") + ").</b><br/>" + (englishOnly ? "NOTE: Only English reviews are displayed." : "Reviews in all languages are displayed.");
	// Lorem ipsum text (to trigger chrome's reaed aloud features)
	let addLoremIpsum = false;
	let loremIpsumTitle = "Reviews";
	let loremIpsumText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
	// Get the HTML content to display in the new tab
	let newTabHTML =
		"<html style='margin: 0; color: black;'>" +
		"<head>" +
		"<title>Reviews</title>" +
		"<style>" +
		"*{ box-sizing: border-box;}" +
		"span { display:inline-block; }" +
		// "::-moz-selection { color: black; background: white; } ::selection { color: black; background: white; }" +
		"</style>" +
		"</head>" +
		"<body style=\"background-color: #f9fcfb; font-family:'Open Sans', sans-serif; font-size: 14px; margin: 0; padding: 1.5em 1.5em;\"><article>" +
		(showIntroductoryText ?
			"<h1>" + titleText + "</h1>" +
			"<p>" + description + "</p>"
			: (addLoremIpsum ? "<h1>" + loremIpsumTitle + "</h1><p>" + loremIpsumText + "</p>" : "")
		) +
		// "<div id='reviews-container' style='width: 100%;'>" + getReviewsHTML(true) + "</div>" +
		getReviewsHTML(true)[0] +
		"</article>" +
		"</body>" +
		"</html>";
	return newTabHTML;
}

function refreshReviewsHTML() {
	let reviewsResults = getReviewsHTML();
	let reviewsHTML = reviewsResults[0];
	let shownReviews = reviewsResults[1];
	document.getElementById("reviews-container").innerHTML = reviewsHTML;
	// Display the reviews count in the debug element
	if (reviews.length > 0) document.getElementById("debug").innerHTML = "<b>Showing " + shownReviews + " / " + reviews.length + " reviews</b>";
	// Auto translate reviews by simulating a click onto the "#google_translate_button .goog-te-combo" select element with value "en"
	let autoTranslate = true;
	if (reviews.length > 0) {
		if (autoTranslate) {
			let selectElement = document.querySelector("#google_translate_button select");
			if (selectElement !== null) {
				selectElement.value = "en";
				// Simulate a change event
				selectElement.dispatchEvent(new Event("change"));
			}
		}
	}
}

function get_reviews(appid, force_refresh = false) {
	// Check if we already have the reviews for the game with appid
	if (lastAppid === appid && !force_refresh) {
		console.log("Reviews already loaded for the game with appid: " + appid);
		return;
	}
	// Set the text of the #reviews-container to "Loading..."
	document.getElementById("reviews-container").innerHTML = "Loading reviews...";
	// Store the last appid
	lastAppid = appid;
	// API URL
	let apiURL = "https://panecaldoaldo.pythonanywhere.com/steam_reviews";
	// Construct the URL parameters ("appid")
	let urlParams = new URLSearchParams();
	// Append the URL parameters
	urlParams.append("appid", appid.toString());
	// Fetch the API URL with the URL parameters
	let requestURL = apiURL + "?" + urlParams.toString();
	console.log("Sending request: " + requestURL);
	fetch(requestURL)
		.then(response => response.json())
		.then(data => {
			try {
				// Display the data in the "response" div
				console.log("> Found " + data.length + " reviews");
				// Store the reviews
				reviews = data;
				// Display the reviews
				refreshReviewsHTML();
			} catch (error) {
				console.error("Client Error: " + error);
				alert("Client Error: " + error);
			}
		})
		.catch(error => {
			console.error("Server Error: " + error);
			alert("Server Error: " + error);
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
	function get_review_element(username, date, recommended, text, language, number) {
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
		reviewElement.id = "review-" + number;
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
		let isEnglish = language === "english";
		let textElement = document.createElement("p");
		textElement.classList.add("text");
		if (!isEnglish) {
			if (!simpleFormat) {
				// Instruct the Google Translate API to translate the text once its original text is populated
				textElement.classList.add("translate");
			} else {
				// Take the existing TRANSLATED text shown in the reviews HTML elements and translate it to English
				let translatedTextPartsElement = document.querySelectorAll("#review-" + number + " .text span");
				let translatedTextParts = [];
				translatedTextPartsElement.forEach(element => {
					translatedTextParts.push(element.innerHTML);
				});
				let translatedText = translatedTextParts.join("\n");
				// Instruct the Google Translate API to NOT translate the text (already in english)
				textElement.classList.add("notranslate");
				textElement.classList.add("pretranslated");
				text = translatedText;
			}
		} else {
			// Instruct the Google Translate API to NOT translate the text (already in english)
			textElement.classList.add("notranslate");
		}
		// Convert the text to HTML with also newlines, spaces, tabs, etc.
		text = text.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
		let text_lines = text.split("\n");
		text = "<span>" + text_lines.join("</span><br/><span>") + "</span>";
		if (simpleFormat) {
			// Add an additional line with the reviews information (text "N) Recommended on DD-MM-YYYY")
			let recommendedText = recommended ? "Recommended" : "NOT Recommended";
			// text = "<p><b>" + number + " | " + recommendedText + "</b> (" + date + ")</p><p>" + text + "</p>";
			text =
				"<span>" +
				"<b>" + number + " | <a style='all: unset; text-decoration: underline; cursor:pointer;' href='https://steamcommunity.com/profiles/" + username + "' target='_blank'>" + recommendedText + "</a></b>" +
				"<elem style='opacity: 0.3;'>&nbsp;(" + date + ")</elem>" +
				(!isEnglish ? "<br/><span style='opacity: 0.3; margin-top: 0.5em;'><b>TRANSLATED</b></span><span style='opacity: 0;'>.</span>" : "") +
				"</span>" +
				// "<br/>" +
				"<span style='display:block; margin-top:0.25em; font-style: " + (isEnglish ? "normal" : "italic") + ";'>" +
				text +
				"</span>";
			// Add a dim background color based on the recommendation
			textElement.style.color = "black";
			textElement.style.display = "block";
			textElement.style.fontSize = "1em";
			textElement.style.backgroundColor = recommended ? "#00ff0050" : "#ff000042";
			textElement.style.padding = "1em 1.3em";
			textElement.style.borderRadius = "0.5em";
			textElement.style.margin = "0 auto";
			textElement.style.marginBottom = "0.5em";
			textElement.style.width = "100%";
			textElement.style.fontWeight = "normal";
			// textElement.style.lineHeight = "1.15em";
			textElement.style.whiteSpace = "wrap";
			textElement.style.wordWrap = "break-word";
		}
		// Function to highlight words that match the filter text
		function highlight_text(textToHighlight, filterText, exactMatch) {
			// Check if the filter text is empty
			if (filterText === "" || filterText === null || filterText.length === 0) return textToHighlight;
			// Highlight color
			let highlightColor = "#ff880070";
			// Highlight text
			if (exactMatch) {
				// Exact match
				textToHighlight = textToHighlight.replace(new RegExp("(" + filterText + ")", "gi"), "<span style='background-color: " + highlightColor + ";'>$1</span>");
			} else {
				// Partial match
				let filterWords = filterText.split(/\s+/);
				for (let i = 0; i < filterWords.length; i++) {
					textToHighlight = textToHighlight.replace(new RegExp("(" + filterWords[i] + ")", "gi"), "<span style='background-color: " + highlightColor + ";'>$1</span>");
				}
			}
			return textToHighlight;
		}
		// Highlight the text based on the filter text
		if (!simpleFormat) {
			// // Highlight the text based on the filter text
			text = highlight_text(text, filterText, exactMatch);
			// Whenever the text of the review changes (because of the Google Translate API), highlight the text again
			textElement.addEventListener("DOMSubtreeModified", function () {
				// Highlight the text based on the filter text
				let text = highlight_text(textElement.innerHTML, filterText, exactMatch);
				textElement.innerHTML = text;
			});
		}
		// Set the text of the text element
		textElement.innerHTML = text;
		// Append the username, date and recommended elements
		firstDivElement.appendChild(usernameElement);
		firstDivElement.appendChild(dateRecommendedElement);
		// Append the first div element and the text element
		reviewElement.appendChild(firstDivElement);
		reviewElement.appendChild(textElement);
		if (!simpleFormat) return reviewElement;
		return textElement;
	}
	// Display the reviews in the "reviews" div
	// let reviewsElement = document.getElementById("reviews-container");
	// Get the current sorting criteria
	let sortingCriteria = document.getElementById("sort-by").value;
	// Get the current "english-only" checkbox value
	let englishOnly = document.getElementsByName("english-only")[0].checked;
	// Get the current review type to display
	let reviewType = document.getElementsByName("review-type")[0].value;
	// get the current min length of the reviews
	let minLength = document.getElementById("min-length").value;
	// Get the filter text and exact match checkbox value
	let filterText = document.getElementById("filter").value;
	let exactMatch = document.getElementsByName("exact-match")[0].checked;
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
	let reviewsShown = 0;
	for (let i = 0; i < reviews.length; i++) {
		// Get the current review
		let review = reviews[i];
		// Check if the review type matches
		if (reviewType === "positive" && !review["voted_up"]) continue;
		if (reviewType === "negative" && review["voted_up"]) continue;
		// Check if the review is in English
		if (englishOnly && review["language"] !== "english") continue;
		// Check if the review has a minimum length (in words)
		if (minLength > 0) {
			// Use a regex to split the words by spaces, tabs, newlines, etc.
			let words = review["review"].split(/\s+/);
			if (words.length < minLength) continue;
		}
		// Check if the review matches the filter text or not
		if (filterText !== "" && filterText !== null && filterText.length > 0) {
			// Check if the review contains any of the filter words (exact match or partial match)
			let matches_filter = false;
			if (exactMatch) {
				// Exact match
				if (review["review"].toLowerCase().includes(filterText.toLowerCase())) matches_filter = true;
			} else {
				// Partial match (at least one word)
				let filterWords = filterText.split(/\s+/);
				for (let i = 0; i < filterWords.length; i++) {
					if (review["review"].toLowerCase().includes(filterWords[i].toLowerCase())) {
						matches_filter = true;
						break;
					}
				}
			}
			if (!matches_filter) continue;
		}
		// Get the review elements
		let date = new Date(review["timestamp_created"] * 1000).toLocaleDateString();
		let formattedDate = date.split("/").join("-");
		let reviewElement = get_review_element(review["author"]["steamid"], formattedDate, review["voted_up"], review["review"], review["language"], i + 1);
		// Append the review element
		htmlToReturn += reviewElement.outerHTML;
		// Increment the reviews shown
		reviewsShown++;
	}
	return [htmlToReturn, reviewsShown];
}



