import os
import random
from flask import Flask, jsonify, flash, request, redirect, url_for,send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
import csv
import ntpath

# Relative Imports
from stork_src.slim.predict import stork_predict
from api.version import api_version

# Define Directories
UPLOAD_DIR = '/uploads'
OUTPUT_DIR = '/output'
STATIC_DIR = '/stork/src'
RESULT_DIR = '/stork/src/stork_src/result'
# RESULT_DIR = os.RESULT_DIR

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])

static_file_dir = os.path.join(STATIC_DIR, 'static')

app = Flask(__name__)
app.config['UPLOAD_DIR'] = UPLOAD_DIR
app.config['SECRET_KEY'] = 'secret_key'
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods = ['GET'])
def serve_index_page():
    return send_from_directory(static_file_dir, 'index.html')

@app.route('/<path:path>', methods = ['GET'])
def serve_assets(path):
    return send_from_directory(static_file_dir, path)

@app.route('/api', methods = ['GET'])
def api_swagger():
    return "Placeholder for Swagger API"

@app.route('/api/healthcheck', methods = ['GET'])
def healthcheck():
    return jsonify({'status':'Healthy', 'version':api_version()})

@app.route('/api/upload', methods = ['POST'])
def upload_image():

    if request.method == 'POST':
        # check if the post request has the file part
        if 'image' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['image']
        # if user does not select file, browser also
        # submit an empty part without filename

        # print(request)
        # print(request.files)

        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_DIR'], filename))

            # Open file, parse txt and convert to json.
            output_filename = 'output_single.txt'           
            output_file = os.path.join(OUTPUT_DIR, output_filename)

            # Call Image Classification here
            stork_predict(['', 'v1', RESULT_DIR, UPLOAD_DIR, output_file, 2])

            # python3 ${PREDICT_DIR}/predict.py v1 ${RESULT_DIR} /input/good/ /output/output_good.txt 2

            # Parse output data

            # Open file, parse txt and convert to json.
            output_filename = 'output_single.txt'           
            output_file = os.path.join(OUTPUT_DIR, output_filename)
            
            image_results = list(csv.reader(open(output_file, 'r', encoding='utf8'), delimiter='\t'))

            # Single Image
            image_result = image_results[0]
            image_filename = ntpath.basename(image_result[0])
            image_good = image_result[1]
            image_poor = image_result[2]

            response = {image_filename: {
                    'Good': image_good,
                    'Poor': image_poor}
                }

            return jsonify(response), 200

            # Array of images
            # response_array=[]

            # for image_result in image_results:

            #     image_filename=ntpath.basename(image_result[0])
            #     image_good=image_result[1]
            #     image_poor=image_result[2]

            #     response= {image_filename: {
            #         'Good': image_good,
            #         'Poor': image_poor}
            #     }

            #     response_array.append(response)

    
            # return jsonify(response_array), 200




            # Random values
            # good_val=random.uniform(0, 1)
            # poor_val=random.uniform(0, 1)

            # return jsonify(
            #     {file.filename: {
            #         'Good': good_val,
            #         'Poor': poor_val}
            #     }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
