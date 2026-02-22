#!/bin/bash
set -e

CERTS_DIR="./certs"
mkdir -p $CERTS_DIR

# Generate CA
openssl req -x509 -newkey rsa:4096 -days 365 -nodes \
  -keyout $CERTS_DIR/ca-key.pem \
  -out $CERTS_DIR/ca-cert.pem \
  -subj "/C=US/ST=CA/L=SF/O=SecureMCP/CN=SecureMCP-CA"

# Generate server cert
openssl req -newkey rsa:4096 -nodes \
  -keyout $CERTS_DIR/server-key.pem \
  -out $CERTS_DIR/server-req.pem \
  -subj "/C=US/ST=CA/L=SF/O=SecureMCP/CN=mcp-server"

openssl x509 -req -in $CERTS_DIR/server-req.pem \
  -CA $CERTS_DIR/ca-cert.pem \
  -CAkey $CERTS_DIR/ca-key.pem \
  -CAcreateserial -days 365 \
  -out $CERTS_DIR/server-cert.pem

# Generate client cert
openssl req -newkey rsa:4096 -nodes \
  -keyout $CERTS_DIR/client-key.pem \
  -out $CERTS_DIR/client-req.pem \
  -subj "/C=US/ST=CA/L=SF/O=SecureMCP/CN=mcp-client"

openssl x509 -req -in $CERTS_DIR/client-req.pem \
  -CA $CERTS_DIR/ca-cert.pem \
  -CAkey $CERTS_DIR/ca-key.pem \
  -CAcreateserial -days 365 \
  -out $CERTS_DIR/client-cert.pem

echo "✅ Certificates generated in $CERTS_DIR"
