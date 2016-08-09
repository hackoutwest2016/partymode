DOCKER_IMAGE_NAME := hackoutwest2016/festlist

.PHONY: image build deploy

all: image build deploy clean

image:
	docker build -t $(DOCKER_IMAGE_NAME) .

build: image
	docker run -v $(PWD):/usr/local/hack hackoutwest2016/festlist bash -c "rm -rf .gradle/; ./gradlew build"

run: build
	docker run -p 8080 $(DOCKER_IMAGE_NAME) bash -c "java -jar build/libs/hack-backend-0.0.1-SNAPSHOT.jar"

deploy:
	docker run -d -p 8080:8080 $(DOCKER_IMAGE_NAME) bash -c "java -jar build/libs/hack-backend-0.0.1-SNAPSHOT.jar"

clean:
	@rm -rf build .gradle/
