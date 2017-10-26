import { expect } from 'chai';

import TextExtraction from '../src/lib/TextExtraction';

describe('TextExtraction', () => {

  describe('#parse', () => {

    it('returns an array with the text if there is no patterns', () => {
      const textExtraction = new TextExtraction('Some Text');

      expect(textExtraction.parse()).to.eql([{children: 'Some Text'}]);
    });

    it('returns an array with the text if the text cant be parsed', () => {
      const textExtraction = new TextExtraction('Some Text', [
        { pattern: /abcdef/ },
      ]);

      expect(textExtraction.parse()).to.eql([{children: 'Some Text'}]);
    });

    it('returns an array with the text and return only present values', () => {
      const textExtraction = new TextExtraction('abcdef', [
        { pattern: /abcdef/ },
      ]);

      expect(textExtraction.parse()).to.eql([{children: 'abcdef'}]);
    });

    it('returns an array with text parts if there is matches', () => {
      const textExtraction = new TextExtraction('hello my website is http://foo.bar, bar is good.', [
        { pattern: /bar/ },
      ]);

      expect(textExtraction.parse()).to.eql([
        {children: 'hello my website is http://foo.'},
        {children: 'bar'},
        {children: ', '},
        {children: 'bar'},
        {children: ' is good.'},
      ]);
    });

    it('return all matched urls', () => {
      const urls = [
        'https://website.bz',
        'http://website2.it',
        'https://t.co/hashKey',
      ]
      const textExtraction = new TextExtraction(
        `this is my website ${urls[0]} and this is also ${urls[1]} ig this one also ${urls[2]}`,
        [{ pattern: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/i }]
      )

      const parsedText = textExtraction.parse();
      expect(parsedText[1].children).to.eql(urls[0])
      expect(parsedText[3].children).to.eql(urls[1])
      expect(parsedText[5].children).to.eql(urls[2])

    })

    it('pass the values to the callbacks', (done) => {
      const textExtraction = new TextExtraction('hello foo', [
        { pattern: /foo/, onPress: (value) => expect(value).to.eql('foo') && done() },
      ]);


      const parsedText = textExtraction.parse();

      expect(parsedText[0]).to.eql({children: 'hello '});
      expect(parsedText[1].children).to.eql('foo');
      expect(parsedText[1].onPress).to.be.instanceof(Function);

      parsedText[1].onPress();
    });

    it('only allow a text to be parsed once', () => {
      const textExtraction = new TextExtraction('hello my website is http://foo.bar, bar is good.', [
        { pattern: /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/ },
        { pattern: /bar/ },
      ]);

      expect(textExtraction.parse()).to.eql([
        {children: 'hello my website is '},
        {children: 'http://foo.bar'},
        {children: ', '},
        {children: 'bar'},
        {children: ' is good.'},
      ]);
    });

    it('respects the parsing order', () => {
      const textExtraction = new TextExtraction('hello my website is http://foo.bar, bar is good.', [
        { pattern: /bar/ },
        { pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/ },
      ]);

      expect(textExtraction.parse()).to.eql([
        {children: 'hello my website is http://foo.'},
        {children: 'bar'},
        {children: ', '},
        {children: 'bar'},
        {children: ' is good.'},
      ]);
    });
  });

  describe('renderText prop', () => {
    it('checks that renderText is a function', (done) => {
      const textExtraction = new TextExtraction('Mention [@michel:561316513]', [
        { pattern: /\[(@[^:]+):([^\]]+)\]/i, renderText: 'foo'}
      ]);

      const parsedText = textExtraction.parse();

      expect(parsedText[0]).to.eql({children: 'Mention '});
      expect(parsedText[1]).to.eql({children: '[@michel:561316513]'});

      done();
    });
    it('pass the values to the callbacks', (done) => {
      const textExtraction = new TextExtraction('Mention [@michel:561316513]', [
        { pattern: /\[(@[^:]+):([^\]]+)\]/i, renderText: (string, matches) => {
          let pattern = /\[(@[^:]+):([^\]]+)\]/i;
          let match = string.match(pattern);
          expect(matches[0]).to.eql("[@michel:561316513]")
          expect(matches[1]).to.eql("@michel")
          expect(matches[2]).to.eql("561316513")
          return `^^${match[1]}^^`;
        }}
      ]);

      const parsedText = textExtraction.parse();

      expect(parsedText[0]).to.eql({children: 'Mention '});
      expect(parsedText[1].children).to.eql('^^@michel^^');

      done();
    });
  });

  describe('pattern is plain string', () => {
    it('returns an array with text parts if there is matches', () => {
      const textExtraction = new TextExtraction('hello my website is http://foo.bar, bar is good.', [
        { pattern: 'bar' },
      ]);

      expect(textExtraction.parse()).to.eql([
        {children: 'hello my website is http://foo.'},
        {children: 'bar'},
        {children: ', '},
        {children: 'bar'},
        {children: ' is good.'},
      ]);
    });

    it('pass the values to the callbacks', (done) => {
      const textExtraction = new TextExtraction('foo bar baz', [
        { pattern: 'bar', renderText: (string, matches) => {
          expect(matches[0]).to.eql('bar');
          return `^^bar^^`;
        }}
      ]);

      const parsedText = textExtraction.parse();

      expect(parsedText[0]).to.eql({children: 'foo '});
      expect(parsedText[1].children).to.eql('^^bar^^');
      expect(parsedText[2]).to.eql({children: ' baz'});

      done();
    });
  });

});
