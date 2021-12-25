# ilda.js

Based on the repository from https://github.com/possan/ilda.js but completely re-done and made readable.

ilda.js is a javascript class that can read and write ILDA data from a binary .ild file.
It supports all the ilda formats defined by the International [Laser Display Association (ILDA)](ilda.com).
The specification document [can be found here](https://www.ilda.com/resources/StandardsDocs/ILDA_IDTF14_rev011.pdf)

This class has zero dependencies so you don't need to download 40 thousand node modules to find out 6 days later after trying 7 package managers that it don't work.
I can tell you that right now ;-). Nah kidding. I am pretty sure this code has bugs and I will update this as I use this class myself in my BangOn Laser Show editor that is not published yet.

The following formats are supported:

- Format 0 – 3D Coordinates with Indexed Color
- Format 1 – 2D Coordinates with Indexed Color
- Format 2 – Color Palette for Indexed Color Frames
- Format 3 - DO NOT USE. UNAPPROVED FORMAT
- Format 4 – 3D Coordinates with True Color
- Format 5 – 2D Coordinates with True Color

# install
I don't do NPM or fantasy, coffee, tea or Coke script so you're on your own there. I just chuck it in the script tag.
```
<script src="ilda.js" type="text/javascript"></script>
```

# usage

```
function selectAndLoadFile(){
  window.showOpenFilePicker({
    types: [
      {description: 'ILD files', accept: {'vector/*': ['.ild']}},
    ],
    excludeAcceptAllOption: true,
    multiple: false
  }).then((fileHandles)=>{
  fileHandles.forEach(fileHandle => {
    fileHandle.getFile().then(file=>{
      // Now we have a file handle. FINALLY
      let reader = new FileReader();
      reader.onload = (evt)=>{
        if (evt.target.readyState == FileReader.DONE) {
          let bytes = new Uint8Array(evt.target.result).toByteArray();
          ILDA.Reader.fromByteArray(bytes, function(data) {
            console.log(data)
            // Yes! finally here is your ILDA data
            // Sorry, I didn't invent this crazy ass API. Maybe I am doing it wrong.

            // Do your thing here

          });
        }
      }
      reader.readAsArrayBuffer(file);
      });
    })
  });
}
```

The ILDA data is an array of frames each holding an array of points. Other properties such as colors vary depending on the ILDA format type.

![image](https://user-images.githubusercontent.com/1192916/147377601-92e079f8-fba7-4b70-ad0b-a764c985d68c.png)

You can change the data object as you wish and save it back to file. for example like:

```
function saveILDADataTofile1(data, fileName){
		ILDA.Writer.toByteArray(data, function(data){
			if (data.length == 0) throw new Error('data.length is zero. Something was not right in the data');
			let fileData = new Uint8Array(data);
			if (fileData.length > 0 ){
				let a = document.createElement("a");
				a.href = window.URL.createObjectURL(new Blob([fileData.buffer], {type: 'octet-stream'}));
				a.download = fileName +'.ild';
				a.click();
			}
		});
	}
  ```


