flask swagger
flask uploader
flask and nginx

# Export Requirements

```bash
pip freeze > requirements.txt
```

## Production Consideration
Use a production WSGI server instead

## Run Manually

```bash
$ python convert.py ../Images/train process/ 0
$ cd run
$ chmod 777 load_inception_v1.sh
$ cd ..
$ ./run/load_inception_v1.sh
$ python predict.py v1 ../result/ ../../Images/test output.txt 2
```

### Run with Docker

#### Environment Variables

```bash
OUTPUT_DIR=~/Documents/2.GitHub/eipm/stork-ui/data/output/
UPLOAD_DIR=~/Documents/2.GitHub/eipm/stork-ui/data/uploads/
PROCESS_DIR=~/Documents/2.GitHub/eipm/stork-ui/data/process/
RESULT_DIR=~/Documents/2.GitHub/eipm/stork-ui/data/result/
USERS_DICT="{ 'stork': 'eipm' }"
```

-v ${INPUT_DIR}:/input:ro \

```bash
docker run -it --rm --name stork \
-p 3000:80 \
-e USERS_DICT \
-v ${OUTPUT_DIR}:/output \
-v ${UPLOAD_DIR}:/uploads \
-v ${PROCESS_DIR}:/stork/src/stork_src/process:ro \
-v ${RESULT_DIR}:/stork/src/stork_src/result:ro \
stork:latest /bin/bash
```

python3 ${PREDICT_DIR}/predict.py v1 ${RESULT_DIR} /uploads /output/output_results.txt 2