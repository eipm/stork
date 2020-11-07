# Stork

Classify IVF images in real time.

[![Python 2.7](https://img.shields.io/badge/python-2.7-blue.svg)](https://www.python.org/downloads/release/python-360/)
[![Python 3.6](https://img.shields.io/badge/python-3.6-blue.svg)](https://www.python.org/downloads/release/python-360/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Stork Logo](docs/images/logo.jpg)

## Run Stork

To run the STORK framework please see the Flowchart.pdf and follow these steps:

1) Install the TensorFlow. Follow the instruction from here: [https://www.tensorflow.org/install/](https://www.tensorflow.org/install/)

2) Pre-trained Models of CNN architectures should be downloaded from the "Pre-trained Models" part of [https://github.com/wenwei202/terngrad/tree/master/slim#pre-trained-models](https://github.com/wenwei202/terngrad/tree/master/slim#pre-trained-models) and be located in your machine (e.g. `GitHub_STORK/scripts/slim/run/checkpoint`). The files for pre-trained models are available under the column named **"Checkpoint"**.

3) Divide the images with the original size into two or more classes based on the aim of classification (e.g., discrimination of good-quality and poor-quality embryos). 85% of images in each class will be selected as Train set (train and validation) and 15% for Test set.

4) **_NUM_CLASSES** should be set in `embryo.py` (located in [src/stork_src/slim/datasets/embryo.py](src/stork_src/slim/datasets/embryo.py)).

5) Run the `convert.py` (located in [src/stork_src/convert.py](src/stork_src/convert.py) the "STORK/scripts" directory) to allocate the suitable percentage of images to train and validation sets.`convert.py` needs three arguments including:
- the address of images for training,
- the address of where the result will be located, 
- and the percentage of validation images for the training step:

Example Command

```bash
python convert.py ../Images/train process/ 0
```

- Keep the percentage of validation images as 0 because we set 15% for validation inside the code

- It will save converted .tf records in the **"process"** directory.

6) The Inception-V1 architecture should be run on the Train set images from the [src/stork_src/scripts/slim] (src/stork_src/scripts/slim) directory.

    1. First navigate to the following directory: [src/stork_src/scripts/slim](src/stork_src/scripts/slim).
    2. Then open `load_inception_v1.sh` located in **"run/"** directory [src/stork_src/scripts/slim/run](src/stork_src/scripts/slim/run) and edit **_PRETRAINED_CHECKPOINT_DIR_**, **_TRAIN_DIR_**, and **_DATASET_DIR_** addresses.
    3. See the load_inception_v1.sh, for instance. Then, run the following command in shell script:

```bash
./run/load_inception_v1.sh
```

- If you get a bash error such as permission denied, run the following command in your shell:

```bash
chmod 777 load_inception_v1.sh
```

- Each script in slim dataset should be run separately based on the selected architecture. The slim folder contains some sub-folders.

- You can set up the parameters of each architectures in **“run”** sub-folder. For example you can set the architecture in a way to run from scratch or trained for the last or all layer. Also you can set the batch size or the number of maximum steps.

- see the result folder at `src/stork_src/scripts/result` as the result of running the above script.

- Note that the flag for `--clone_on_cpu` is set to "True". If you are going to use GPUs you should change this flag to "False".

7) The trained algorithms should be tested using test set images. In folder [src/stork_src/scripts/slim](src/stork_src/scripts/slim), `predict.py` loads a trained model on provided images. This script requires 5 arguments:

```bash
python predict.py v1 ../result/ ../../Images/test output.txt 2
```

- v1 = inception-v1, ../Images/test = the address of test set images, out.txt = the output result file, 2 = number of classes

- You can see output.txt in [src/stork_src/scripts/slim](src/stork_src/scripts/slim), for example.

8) The accuracy can be measured using accuracy measurement codes ("acc.py") in "useful" folder. The `output.txt` file should be in the same folder that you are running acc.py. Then run the following code:

```bash
$ python acc.py
```

- [https://kwotsin.github.io/tech/2017/02/11/transfer-learning.html](https://kwotsin.github.io/tech/2017/02/11/transfer-learning.html)

## Run Stork using Docker

### Docker Requirements

- Docker. Get it from [here](https://www.docker.com/).
- `process` and `result` folders from ML training (Not included in this repository).

### Load Environment Variables

```bash
DOCKER_CONTAINER_NAME=stork \
STORK_PORT=3000 \
OUTPUT_DIR=/stork/data/output/
UPLOAD_DIR=/stork/data/uploads/
PROCESS_DIR=/stork/data/process/
RESULT_DIR=/stork/data/result/
STORK_TAG=latest
```

### Run Docker Container

```bash
docker run -d --name ${DOCKER_CONTAINER_NAME} \
--restart on-failure:5 \
-p ${STORK_PORT}:80 \
-v ${OUTPUT_DIR}:/output \
-v ${UPLOAD_DIR}:/uploads \
-v ${PROCESS_DIR}:/stork/src/stork_src/process:ro \
-v ${RESULT_DIR}:/stork/src/stork_src/result:ro \
--env USERS_DICT="{ 'username1': 'password', 'username2': 'password', 'username3': 'password' }" \
eipm/stork:${STORK_TAG}
```

Where:

- **${DOCKER_CONTAINER_NAME}**: The Stork docker container name.
- **${STORK_PORT}**: The Stork host port.
- **${OUTPUT_DIR}**: Where Stork image classification logs will be written.
- **${UPLOAD_DIR}**: Where Stork image will be saved.
- **${PROCESS_DIR}**: Required directory from ML training.
- **${RESULT_DIR}**: Required directory from ML training.
- **${USERS_DICT}**: The users credentials dictionary to authenticate.
- **${STORK_TAG}**: The Stork version to deploy.
