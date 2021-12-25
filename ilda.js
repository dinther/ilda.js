(function(t) {
    var g = {
        version: "ILDA5.JS"
    }
      , FrameTypes = {
        COORD_3D: 0,
        COORD_2D: 1,
        COLOR_TABLE: 2,
        TRUE_COLOR_TABLE: 3,
        COORD_3D_TRUE_COL: 4,
        COORD_2D_TRUE_COL: 5,
        UNKNOWN: 99
    }
      , Point = function(x=0, y=0, z=0, colorIndex=0, blanking=true) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.colorIndex = colorIndex;
        this.blanking = blanking;
        this.last = blanking;
    };
    g.Point = Point;
    var Color = function() {
        this.b = this.g = this.r = 0
    };
    g.Color = Color;
    var Frame = function(owner='', project='', type=ILDA.FrameTypes.COORD_2D, index=0, colors=defaultColors, total=0, head=0) {
        this.owner = owner;
        this.project = project;
        this.type = type;
        this.index = 0;
        this.points = [];
        this.total = total;
        this.head = head;
        this.colors = colors;
    }
      , s = function() {
        this.frames = []
    };
    g.Frame = Frame;
    g.FrameTypes = FrameTypes;
    g.File = s;
    var ArrayReader = function(c) {
        this.bytes = c || [];
        this.position = 0;
        this.length = this.bytes.length
    };
    ArrayReader.prototype.seek = function(c) {
        this.position = c
    }
    ;
    ArrayReader.prototype.eof = function() {
        return this.position >= this.length
    }
    ;
    ArrayReader.prototype.readString = function(count) {
        let text = '';
        for (let i = 0; i < count; i++) {
            let b = this.readByte();
            0 < b && 127 > b && (text += String.fromCharCode(b))
        }
        return text.trim()
    }
    ;
    ArrayReader.prototype.readByte = function() {
        var b = this.bytes[this.position];
        this.position++;
        return b
    }
    ;
    ArrayReader.prototype.readShort = function() {
        var c = this.readByte()
          , h = this.readByte();
        return (c << 8) + h
    }
    ;
    ArrayReader.prototype.readSignedShort = function() {
        var c = this.readByte()
          , h = this.readByte()
          , c = (c << 8) + h;
        32768 < c && (c = -(65535 - c));
        return c
    }
    ;
    ArrayReader.prototype.readLong = function() {
        var c = this.readByte()
          , h = this.readByte()
          , b = this.readByte();
        return this.readByte() + (b << 8) + (h << 16) + (c << 24)
    }
    ;
    g.Reader = {
        fromByteArray: function(c, h) {
            for (g = new s, arrayReader = new ArrayReader(c); !arrayReader.eof() && "ILDA" == arrayReader.readString(4); ) {
                var frame = new Frame;
                arrayReader.readString(3); //skip next 3 bytes
                frame.type = arrayReader.readByte();
                switch (frame.type) {
                case FrameTypes.COORD_3D:
                    frame.project = arrayReader.readString(8);
                    frame.owner = arrayReader.readString(8);
                    frame.pointTotal = arrayReader.readShort();
                    frame.index = arrayReader.readShort();
                    frame.total = arrayReader.readShort();
                    frame.head = arrayReader.readByte();
                    arrayReader.readByte();
                    for (let i = 0; i < frame.pointTotal; i++) {
                        point = new Point;
                        point.x = arrayReader.readSignedShort();
                        point.y = arrayReader.readSignedShort();
                        point.z = arrayReader.readSignedShort();
                        l = arrayReader.readShort();
                        point.colorIndex = l >> 0 & 127;
                        point.blanking = 16384 == (l & 16384);
                        point.last = 32768 == (l & 32768);
                        frame.points.push(point);
                    }
                    break;
                case FrameTypes.COORD_2D:
                    frame.project = arrayReader.readString(8);
                    frame.owner = arrayReader.readString(8);
                    frame.pointTotal = arrayReader.readShort();
                    frame.index = arrayReader.readShort();
                    frame.total = arrayReader.readShort();
                    frame.head = arrayReader.readByte();
                    arrayReader.readByte();
                    for (let i = 0; i < frame.pointTotal; i++)
                        point = new Point,
                        point.x = arrayReader.readSignedShort(),
                        point.y = arrayReader.readSignedShort(),
                        point.z = 0;
                        l = arrayReader.readShort(),
                        point.colorIndex = l >> 0 & 127,
                        point.blanking = 16384 == (l & 16384),
                        point.last = 32768 == (l & 32768),
                        frame.points.push();
                    break;
                case FrameTypes.COLOR_TABLE:
                    frame.project = arrayReader.readString(8);
                    frame.owner = arrayReader.readString(8);
                    frame.pointTotal = arrayReader.readShort();  //number of records
                    if (frame.pointTotal<2 || frame.pointTotal>256) throw new Error('Incorrect palette size. Must be between 2 and 255.')
                    frame.paletteNumber = arrayReader.readShort();
                    arrayReader.readByte(); //skip
                    arrayReader.readByte(); //skip
                    frame.head = arrayReader.readByte();
                    //arrayReader.readByte(); //This should not be here according to spec
                    for (let i = 0; i < frame.pointTotal; i++)
                        color = new Color,
                        color.r = arrayReader.readByte(),
                        color.g = arrayReader.readByte(),
                        color.b = arrayReader.readByte(),
                        frame.colors.push(color);
                    break;
                case FrameTypes.TRUE_COLOR_TABLE:
                    arrayReader.readLong();
                    frame.pointTotal = arrayReader.readLong();
                    for (let i = 0; i < frame.pointTotal; i++)
                        color = new Color,
                        color.r = arrayReader.readByte(),
                        color.g = arrayReader.readByte(),
                        color.b = arrayReader.readByte(),
                        frame.colors.push(color)
                    break;
                case FrameTypes.COORD_3D_TRUE_COL:
                    frame.project = arrayReader.readString(8);
                    frame.owner = arrayReader.readString(8);
                    frame.pointTotal = arrayReader.readShort();
                    frame.index = arrayReader.readShort();
                    frame.total = arrayReader.readShort();
                    frame.head = arrayReader.readByte();
                    arrayReader.readByte();
                    for (i = 0; i < frame.pointTotal; i++) {
                        var point = new Point;
                        point.x = arrayReader.readSignedShort();
                        point.y = arrayReader.readSignedShort();
                        point.z = arrayReader.readSignedShort();
                        var l = arrayReader.readByte();
                        point.blanking = l>>6 & 1;
                        point.last = l>>7 & 1;
                        point.color = new Color,
                        point.color.b = arrayReader.readByte();
                        point.color.g = arrayReader.readByte();
                        point.color.r = arrayReader.readByte();
                        frame.points.push(point)
                    }
                    break;
                case FrameTypes.COORD_2D_TRUE_COL:
                    frame.project = arrayReader.readString(8);
                    frame.owner = arrayReader.readString(8);
                    frame.pointTotal = arrayReader.readShort();
                    frame.index = arrayReader.readShort();
                    frame.total = arrayReader.readShort();
                    frame.head = arrayReader.readByte();
                    arrayReader.readByte();
                    for (let i = 0; i < frame.pointTotal; i++) {
                        var point = new Point;
                        point.x = arrayReader.readSignedShort();
                        point.y = arrayReader.readSignedShort();
                        point.z = 0;
                        var l = arrayReader.readByte();
                        point.blanking = l>>6 & 1;
                        point.last = l>>7 & 1;
                        point.color = new Color,
                        point.color.b = arrayReader.readByte();
                        point.color.g = arrayReader.readByte();
                        point.color.r = arrayReader.readByte();
                        frame.points.push(point)
                    }
                    break;                    
                }
                g.frames.push(frame)
            }
            h(g)
        }
    };
    var n = function(c) {
        this.animation = c || new Animation
    };
    n.prototype.addAnimation = function(c) {
        for (frame in c.frames)
            this.addFrame(frame)
    }
    ;
    n.prototype.addFrame = function(c) {
        this.animation.addFrame(c)
    }
    ;
    var ArrayWriter = function() {
        this.bytes = []
    };
    ArrayWriter.prototype.writeByte = function(c) {
        this.bytes.push(c)
    }
    ;
    ArrayWriter.prototype.writeShort = function(c) {
        this.writeByte(c >> 8 & 255);
        this.writeByte(c >> 0 & 255)
    }
    ;
    ArrayWriter.prototype.writeSignedShort = function(c) {
        0 > c && (c = 65535 + c);
        this.writeByte(c >> 8 & 255);
        this.writeByte(c >> 0 & 255)
    }
    ;
    ArrayWriter.prototype.writeLong = function(c) {
        this.writeByte(c >> 24 & 255);
        this.writeByte(c >> 16 & 255);
        this.writeByte(c >> 8 & 255);
        this.writeByte(c >> 0 & 255)
    }
    ;
    ArrayWriter.prototype.writeString = function(c, h) {
        for (var b = 0; b < h; b++)
            b < c.length ? this.writeByte(c.charCodeAt(b)) : this.writeByte(0)
    }
    ;
    n.toByteArray = function(c, h) {
        var arrayWriter = new ArrayWriter, g;
        for (g in c.frames) {
            var frame = c.frames[g];
            switch (frame.type) {
            case FrameTypes.COORD_3D:
                arrayWriter.writeString("ILDA", 4);
                arrayWriter.writeLong(frame.type);
                arrayWriter.writeString(frame.project, 8);
                arrayWriter.writeString(frame.owner, 8);
                arrayWriter.writeShort(frame.points.length);
                arrayWriter.writeShort(frame.index);
                arrayWriter.writeShort(frame.total);
                arrayWriter.writeByte(frame.head);
                arrayWriter.writeByte(0);
                for (var e = 0; e < frame.points.length; e++) {
                    var f = frame.points[e];
                    arrayWriter.writeSignedShort(f.x);
                    arrayWriter.writeSignedShort(f.y);
                    arrayWriter.writeSignedShort(f.z);
                    var d = 0
                      , d = d | f.colorIndex & 127;
                    f.blanking && (d |= 16384);
                    if (f.last || e == frame.points.length - 1)
                        d |= 32768;
                    arrayWriter.writeShort(d)
                }
                break;
            case FrameTypes.COORD_2D:
                arrayWriter.writeString("ILDA", 4);
                arrayWriter.writeLong(frame.type);
                arrayWriter.writeString(frame.project, 8);
                arrayWriter.writeString(frame.owner, 8);
                arrayWriter.writeShort(frame.points.length);
                arrayWriter.writeShort(frame.index);
                arrayWriter.writeShort(frame.total);
                arrayWriter.writeByte(frame.head);
                arrayWriter.writeByte(0);
                for (e = 0; e < frame.points.length; e++) {
                    f = frame.points[e];
                    arrayWriter.writeSignedShort(f.x);
                    arrayWriter.writeSignedShort(f.y);
                    d = 0;
                    d |= f.colorIndex & 127;
                    f.blanking && (d |= 16384);
                    if (f.last || e == frame.points.length - 1)
                        d |= 32768;
                    arrayWriter.writeShort(d)
                }
                break;
            case FrameTypes.COLOR_TABLE:
                arrayWriter.writeString("ILDA", 4);
                arrayWriter.writeLong(frame.type);
                arrayWriter.writeString(frame.project, 8);
                arrayWriter.writeString(frame.owner, 8);
                arrayWriter.writeShort(frame.colors.length);
                arrayWriter.writeShort(frame.index);
                arrayWriter.writeByte(0);
                arrayWriter.writeByte(0);
                arrayWriter.writeByte(frame.head);
                arrayWriter.writeByte(0);
                for (e = 0; e < frame.colors.length; e++)
                    f = frame.colors[e],
                    arrayWriter.writeByte(f.r),
                    arrayWriter.writeByte(f.g),
                    arrayWriter.writeByte(f.b);
                break;
            case FrameTypes.TRUE_COLOR_TABLE:
                arrayWriter.writeString("ILDA", 4);
                arrayWriter.writeLong(frame.type);
                arrayWriter.writeLong(3 * frame.colors.length + 4);
                arrayWriter.writeLong(frame.colors.length);
                for (e = 0; e < frame.colors.length; e++)
                    f = frame.colors[e],
                    arrayWriter.writeByte(f.r),
                    arrayWriter.writeByte(f.g),
                    arrayWriter.writeByte(f.b)
                break;
            case FrameTypes.COORD_3D_TRUE_COL:
                arrayWriter.writeString("ILDA", 4);
                arrayWriter.writeLong(frame.type);
                arrayWriter.writeString(frame.project, 8);
                arrayWriter.writeString(frame.owner, 8);
                arrayWriter.writeShort(frame.points.length);
                arrayWriter.writeShort(frame.index);
                arrayWriter.writeShort(frame.total);
                arrayWriter.writeByte(frame.head);
                arrayWriter.writeByte(0);
                for (var e = 0; e < frame.points.length; e++) {
                    var f = frame.points[e];
                    arrayWriter.writeSignedShort(f.x);
                    arrayWriter.writeSignedShort(f.y);
                    arrayWriter.writeSignedShort(f.z);
                    var d = 0;
                    f.blanking && (d |= 64);
                    if (f.last || e == frame.points.length - 1)
                        d |= 128;
                    arrayWriter.writeByte(d);
                    arrayWriter.writeByte(f.color.b);
                    arrayWriter.writeByte(f.color.g);
                    arrayWriter.writeByte(f.color.r);
                }
                break;
            case FrameTypes.COORD_2D_TRUE_COL:
                arrayWriter.writeString("ILDA", 4);
                arrayWriter.writeLong(frame.type);
                arrayWriter.writeString(frame.project, 8);
                arrayWriter.writeString(frame.owner, 8);
                arrayWriter.writeShort(frame.points.length);
                arrayWriter.writeShort(frame.index);
                arrayWriter.writeShort(frame.total);
                arrayWriter.writeByte(frame.head);
                arrayWriter.writeByte(0);
                for (var e = 0; e < frame.points.length; e++) {
                    var f = frame.points[e];
                    arrayWriter.writeSignedShort(f.x);
                    arrayWriter.writeSignedShort(f.y);
                    var d = 0;
                    f.blanking && (d |= 64);
                    if (f.last || e == frame.points.length - 1)
                        d |= 128;
                    arrayWriter.writeByte(d);
                    arrayWriter.writeByte(f.color.b);
                    arrayWriter.writeByte(f.color.g);
                    arrayWriter.writeByte(f.color.r);
                }
                break;    
            }
        }
        h(arrayWriter.bytes)
    };
    g.Writer = n;
    g.Utils = {};
    t.ILDA = g
}
)(this);
