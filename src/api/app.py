import os
import random
from flask import Flask, jsonify, flash, request, redirect, url_for,send_from_directory,make_response
from werkzeug.utils import secure_filename
from flask_cors import CORS
import uuid as myuuid
import csv
import cv2
import glob
import ntpath
import datetime
from ast import literal_eval

# Relative Imports
from api.version import api_version

# Define Directories
UPLOAD_DIR = '/uploads'
OUTPUT_DIR = '/output'
STATIC_DIR = '/stork/src'

ALLOWED_EXTENSIONS = set(['jpg', 'png', 'tif', 'tiff'])

static_file_dir = os.path.join(STATIC_DIR, 'static')

app = Flask(__name__)
app.config['UPLOAD_DIR'] = UPLOAD_DIR
app.config['SECRET_KEY'] = 'secret_key'
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app)

users_dict = literal_eval(os.environ['USERS_DICT'])

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
    return "Swagger API coming soon..."

@app.route('/api/healthcheck', methods = ['GET'])
def healthcheck():
    return jsonify({'status':'Healthy', 'version':api_version()})

@app.route('/login', methods = ['GET'])
def serve_login_page():
    return send_from_directory(static_file_dir, 'login.html')

@app.route('/api/login', methods = ['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    if username and users_dict[username] == password:
        response = make_response()
        uuid = str(myuuid.uuid4())
        response.set_cookie('stork-auth', uuid, max_age=3600)
        return response
    return jsonify({}), 401

@app.route('/api/upload', methods = ['POST'])
def upload_image():
    auth_token = None
    auth_header = request.headers.get('Authorization')
    print(auth_header)
    if auth_header is None or auth_header.split(" ")[1] is None:
        flash('No Authorization header')
        return jsonify({}), 401

    # check if the post request has the file part
    if 'image' not in request.files:
        flash('No file part')
        return redirect(request.url)

    # 1. Create request directory
    request_id = datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
    request_dir = (os.path.join(app.config['UPLOAD_DIR'], request_id))
    if not os.path.exists(request_dir):
        os.makedirs(request_dir)

    response_dict = {}
    images_dict = {}
    # For each uploaded image
    for image in request.files.getlist("image"):
        # 2. Save Image
        filename = secure_filename(image.filename)
        image.save(os.path.join(request_dir, filename))

        images_dict[filename] = image.filename

        # =============#
        # Analyze Data #
        # =============#

    # 3. Normalize images to jpeg format
    for image in glob.glob(os.path.join(request_dir, '*.*')):
        img = cv2.imread(image)
        os.remove(image)
        filename = '%s.jpg' % os.path.splitext(image)[0]
        cv2.imwrite(os.path.join(request_dir, filename), img)

    # 4. Specify Output log
    output_filename = 'output_' + request_id + '.txt'
    output_file = os.path.join(OUTPUT_DIR, output_filename)

    # 5. Run Stork
    python_command='python3 ' + os.environ['PREDICT_DIR'] + '/predict.py v1 ' + os.environ['RESULT_DIR'] + ' ' + request_dir + ' ' + output_file + ' 2'
    os.system(python_command)

    # 6. Parse Stork Results
    image_results = list(csv.reader(open(output_file, 'r', encoding='utf8'), delimiter='\t'))

    # ==================#
    # Send JSON Results #
    # ==================#

    for image_result in image_results:
        filepath = ntpath.basename(image_result[0])
        filename = os.path.splitext(filepath)[0]
        for saved_file_name, initital_file_name in images_dict.items():
            if saved_file_name.lower() in [("{}.{}".format(filename, ext)).lower() for ext in ALLOWED_EXTENSIONS]:
                response_dict[initital_file_name] = { 'Good': image_result[1], 'Poor': image_result[2] }
                break

    return jsonify(response_dict), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
