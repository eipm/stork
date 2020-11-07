FROM python:3.6.8-stretch
#===============================#
# Docker Image Configuration	#
#===============================#
LABEL org.opencontainers.image.source='https://github.com/eipm/stork' \
    vendor='Englander Institute for Precision Medicine' \
    description='STORK' \
    maintainer='als2076@med.cornell.edu' \
    base_image='python' \
    base_image_version='3.6.8-stretch'

ENV APP_NAME='stork' \
    TZ='US/Eastern' \
    STORK_SRC_DIR='/stork/src/stork_src' \
    PREDICT_DIR='/stork/src/stork_src/slim'
ENV RESULT_DIR=${STORK_SRC_DIR}/result \
    PROCESS_DIR=${STORK_SRC_DIR}/process \
    PYTHONPATH=${PYTHONPATH}:${STORK_SRC_DIR}:${PREDICT_DIR}

#===================================#
# Install Prerequisites         	#
#===================================#
COPY requirements.txt /${APP_NAME}/requirements.txt
RUN pip install -r /${APP_NAME}/requirements.txt
#===================================#
# Copy Files and set work directory	#
#===================================#
COPY src /${APP_NAME}/src/
WORKDIR /${APP_NAME}
#===================================#
# Startup							#
#===================================#
EXPOSE 80
VOLUME uploads
VOLUME output

HEALTHCHECK --interval=30s --timeout=30s --retries=3 \
    CMD curl -f -k http://0.0.0.0/api/healthcheck || exit 1

CMD python3 /${APP_NAME}/src/main.py
