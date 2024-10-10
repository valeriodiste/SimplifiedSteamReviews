# Check if running locally
running_locally = False
try:
	from flask import Flask, request
except ImportError:
	running_locally = True
	print("Running locally.")

import requests
import json
import math
from urllib.parse import quote_plus

app = None
if not running_locally:
	app = Flask(__name__)

# Get all steam reviews for the given game's appid using the Steam API
@app.route('/steam_reviews', methods=['GET','POST'])
def get_reviews_api():
	# Get the request's parameters
	appid = request.args.get('appid')
	english_only = request.args.get('english_only')
	# Get the reviews
	reviews = get_reviews(appid, english_only)
	return json.dumps(reviews)
def get_reviews(appid, english_only=True):
	# API infos
	steamAPI = f"http://store.steampowered.com/appreviews/{appid}"
	parameters = {
		"json": 1,
		"filter": "recent",	# [recent, updated, all]
		"language": "english" if english_only else "all",
		# "day_range": "365",
		"review_type": "all",	# [all, positive, negative]
		"purchase_type": "all",		# [all, non_steam_purchase, steam_purchase]
		"num_per_page": 100,
		"filter_offtopic_activity": 1,	# Don't include review bombs (if detected)
		"cursor": "*"
	}
	steamAPI += "?" + "&".join([f"{key}={value}" for key, value in parameters.items()])
	steamAPI = quote_plus(steamAPI, safe=':/?&=,')
	# Request
	response = requests.get(steamAPI)
	# print(json.dumps(response.json(), indent=4))
	# Get the "cursor" from the response and use it to get all reviews
	cursor = response.json()['cursor']
	reviews = response.json()['reviews']
	total_review_count = response.json()['query_summary']['total_reviews']
	print("Getting ", total_review_count, " reviews for appid ", appid, "...",sep="")
	while cursor:
		# Update the cursor
		parameters['cursor'] = cursor
		steamAPI = f"http://store.steampowered.com/appreviews/{appid}"
		steamAPI += "?" + "&".join([f"{key}={value}" for key, value in parameters.items()])
		steamAPI = quote_plus(steamAPI, safe=':/?&=,')
		# Request
		response = requests.get(steamAPI)
		response = response.json()
		if 'reviews' not in response:
			print("Error: ", response)
			break
		# Check if the response is empty (we reached the end of the reviews)
		if not response['reviews'] or not response['cursor']:
			break
		reviews.extend(response['reviews'])
		cursor = response['cursor']
		# Print the completion percentage
		completion_percentage = len(reviews) / total_review_count * 100
		print(f"\r{len(reviews)} / {total_review_count} ({completion_percentage:.2f}%)", end="")
	return reviews

# Test the function
if __name__ == '__main__':
	# Get reviews for the game "ROLL"
	reviews = get_reviews(1585910, english_only=True)
	# Print the reviews with an indent
	print(json.dumps(reviews, indent=4))