build:
	docker-compose build
test:
	docker-compose up main
dep-check:
	docker-compose run main yarn run check
dep-checku:
	docker-compose run main yarn run checku
.PHONY: build test dep-check dep-checku
