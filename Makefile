docs:
	echo && echo "Generating JavaScript documentation with jsdoc…" && echo
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json
	echo
	for HTMLDOC in ./gh-pages/**.html; do cat $$HTMLDOC | sed 's/<title>JSDoc: /<title>sassy-test JavaScript API: /' > $$HTMLDOC.tmp; mv $$HTMLDOC.tmp $$HTMLDOC; done

.PHONY: docs
