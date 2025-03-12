# ---- Base Node ----
FROM node:lts AS build

ARG VITE_DEPLOYMENT_ENV

WORKDIR /app

COPY package*.json ./

RUN set -eux \
  && npm install

COPY . .
RUN set -eux \
  && npx vite build --mode ${VITE_DEPLOYMENT_ENV}

FROM node:lts AS runner

COPY --from=build /app/dist /app

RUN set -eux \
  && npm install -g wrangler@latest 
#  && adduser burnt \
#  && chown -R burnt:burnt /app

WORKDIR /app
#USER burnt

CMD [ "wrangler", "pages", "dev", "./", "--compatibility-flags", "nodejs_compat", "--show-interactive-dev-session", "false", "--ip", "0.0.0.0", "--port", "3000" ]
