FROM alpine:3.4
MAINTAINER Johan Backman<backman93@gmail.com>

RUN apk --update add openjdk7-jre

ADD . /root/party
WORKDIR /root/party

# TODO: Run backend application here
CMD ["/usr/bin/java", "-version"]
