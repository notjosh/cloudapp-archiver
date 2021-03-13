# cloudapp-archiver

Dump yr cloudapp archive!

## About

Tired of all yr data being locked up behind an opaque service wall on CloudApp? Well, you're in luck!

## Usage

Get installed:

```
git clone https://github.com/notjosh/cloudapp-archiver.git
cd cloudapp-archiver
yarn
```

By default, it'll ask you so supply username/password, and then run through the authentication flow for you. The simplest command is as follows, which will write to the output directory (default `out`, configurable with flag `-o`):

```
bin/run [-o path/to/output]
```

Once you have a token, you can supply it via env var `CLOUDAPP_TOKEN`, or flag `-t`:

```
bin/run -t abc123def456
```

It'll cache the requests pretty aggressively, and not try to overwrite anything. We can force a full refresh via flag `-f`:

```
bin/run -f
```

...or if you just want to pull the latest metadata, and only download the latest files, use flag `-l`:

```
bin/run -l
```
