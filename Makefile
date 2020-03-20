PROJECT_NAME ?= project-name
PROCESSOR ?= initiative-name

ARTEFACT_BUCKET ?= s3-bucket-code-storage
BUILD_NUMBER ?= 0

ENV ?= Development
AWS_ROLE ?= arn:aws:iam::accountnumber:role/role-name

CODE = src
TEST = tests/test*
DIST = dist

S3_KEY = $(PROJECT_NAME)/$(PROCESSOR)/$(DIST)-$(BUILD_NUMBER).zip


COMPOSE_RUN_SCEPTRE = docker-compose run --rm sceptre
COMPOSE_RUN_LINT = docker-compose run --rm lint
COMPOSE_RUN_JSLINT = docker-compose run --rm jslint
COMPOSE_RUN_AWS = docker-compose run --rm aws
COMPOSE_RUN_NODE = docker-compose run --rm node

lint: pre-build
	$(COMPOSE_RUN_LINT) yamllint .
	$(COMPOSE_RUN_JSLINT) eslint /apps/src
PHONY: lint

validate: pre-build
	$(COMPOSE_RUN_AWS) make _validate
.PHONY: validate

pre-build:
	rm -rf .env
	cp .env.template .env
.PHONY: pre-build

build: pre-build
	$(COMPOSE_RUN_NODE) make _build
.PHONY: build

test: pre-build
	$(COMPOSE_RUN_NODE) bash -c 'make _test'
.PHONY: test

package: pre-build
	$(COMPOSE_RUN_AWS) make _package
.PHONY: package

deploy: pre-build
	$(COMPOSE_RUN_SCEPTRE) make _deploy
.PHONY: deploy

remove: pre-build validate
	$(COMPOSE_RUN_SCEPTRE) make _remove
.PHONY: remove

clean:
	$(COMPOSE_RUN_AWS) make _clean
.PHONY: clean

# Internal Targets

_validate:
	echo "validating cloudformation"
	for tpl in $$(find templates -name "*.yaml" -or -name "*.yml" -type f) ; do \
		echo "Validating '$${tpl}'"; \
		aws cloudformation validate-template --template-body file://$${tpl} || exit $?; \
	done

_build:
	rm -rf $(DIST)
	mkdir $(DIST)
	cd $(CODE) && cp -r `ls -A | grep -v "node_modules"` ../$(DIST) && cd ..
	cd $(DIST) && npm install

_test:
	cd $(CODE) && npm i -g mocha && mocha

_package:
	cd $(DIST) && zip -qr9 dist.zip .
	aws s3 cp $(DIST)/dist.zip s3://$(ARTEFACT_BUCKET)/$(S3_KEY)

_deploy:
	$(eval export ENV = $(ENV))
	$(eval export AWS_ROLE = $(AWS_ROLE))
	$(eval export ARTEFACT_BUCKET = $(ARTEFACT_BUCKET))
	$(eval export S3_KEY = $(S3_KEY))
	@bash scripts/deploy_infra.sh

_clean:
	rm -rf $(DIST)*
	rm -f .env

_remove:
	sceptre --var-file=variables.yaml --var "iam_role=$(AWS_ROLE)" delete-env test-framework
