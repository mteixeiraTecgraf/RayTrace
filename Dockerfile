### STAGE 1: Build ###
FROM node:16

EXPOSE 4200
EXPOSE 49153

VOLUME /src
WORKDIR /src
RUN npm install -g @angular/cli

#ENTRYPOINT ["npm", "start", "--", "--host", "0.0.0.0", '--pool']
#ENTRYPOINT ["bash"]