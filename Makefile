NAME		:= hormi-image-converter
IMAGE		:= $(NAME):local
CONTAINER	:= $(NAME)
LOCAL_HOST	?= 127.0.0.1
PUBLIC_HOST	?= 0.0.0.0
HOST		?= $(LOCAL_HOST)
PORT		?= 8080
PYTHON		?= python3
NODE		?= node
LAN_IP		?= $(shell ip route get 1.1.1.1 2>/dev/null | sed -n 's/.*src \([0-9.]*\).*/\1/p' | head -n 1)
ifeq ($(LAN_IP),)
LAN_IP		:= $(shell hostname -I 2>/dev/null | cut -d ' ' -f 1)
endif

.PHONY: all build run run-net stop clean fclean re test serve serve-net urls urls-net doctor doctor-net logs ps help

all: build

build:
	docker build -t $(IMAGE) .

run: build
	docker run --rm -d --name $(CONTAINER) -p $(HOST):$(PORT):80 $(IMAGE)
	@$(MAKE) --no-print-directory urls HOST=$(HOST)

run-net: HOST = $(PUBLIC_HOST)
run-net: run

stop:
	@docker stop $(CONTAINER) >/dev/null 2>&1 || true

clean: stop

fclean: clean
	@docker rmi $(IMAGE) >/dev/null 2>&1 || true

re: fclean all

test:
	$(NODE) tests/test-runner.mjs

serve:
	@$(MAKE) --no-print-directory urls HOST=$(HOST)
	$(PYTHON) -m http.server $(PORT) --bind $(HOST) -d src

serve-net: HOST = $(PUBLIC_HOST)
serve-net: serve

urls:
	@echo "Local:        http://localhost:$(PORT)"
	@echo "Escuchando:  http://$(HOST):$(PORT)"
	@if [ "$(HOST)" = "$(PUBLIC_HOST)" ]; then \
		if [ -n "$(LAN_IP)" ]; then \
			echo "Otro equipo: http://$(LAN_IP):$(PORT)"; \
		else \
			echo "Otro equipo: usa la IP LAN del servidor, no 0.0.0.0"; \
			echo "             prueba: ip -4 addr"; \
		fi; \
	else \
		echo "Red:         no expuesto. Usa make run-net o make serve-net"; \
	fi

urls-net: HOST = $(PUBLIC_HOST)
urls-net: urls

doctor:
	@echo "HOST=$(HOST)"
	@echo "PORT=$(PORT)"
	@$(MAKE) --no-print-directory urls HOST=$(HOST)
	@echo "Docker:"
	@docker ps --filter name=$(CONTAINER) 2>/dev/null || true
	@echo "Si no conecta desde otro equipo, revisa firewall y que ambos esten en la misma red."
	@echo "Linux/ufw: sudo ufw allow $(PORT)/tcp"

doctor-net: HOST = $(PUBLIC_HOST)
doctor-net: doctor

logs:
	docker logs $(CONTAINER)

ps:
	docker ps --filter name=$(CONTAINER)

help:
	@echo "Targets:"
	@echo "  make build     - crea imagen Docker local"
	@echo "  make run       - despliega contenedor solo en local: http://localhost:$(PORT)"
	@echo "  make run-net   - despliega contenedor en red: http://0.0.0.0:$(PORT)"
	@echo "  make serve     - sirve ./src solo en local"
	@echo "  make serve-net - sirve ./src expuesto a la red"
	@echo "  make test    - ejecuta pruebas sin npm"
	@echo "  make urls      - muestra URLs del modo local"
	@echo "  make urls-net  - muestra URLs del modo red"
	@echo "  make doctor    - muestra diagnostico local"
	@echo "  make doctor-net - muestra diagnostico de red"
	@echo "  make stop    - para el contenedor"
	@echo "  make fclean  - elimina contenedor e imagen"
