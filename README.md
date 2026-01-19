<p align="center">
<h1 align="center">Smart List</h1>
</p>

Smart List is a dynamic, framework agnostic, and lightweight (~13kb gzipped) &lt;select&gt; UI control.
With autocomplete and native-feeling keyboard navigation, it's useful for tagging, contact lists, country selectors, and so on.
Smart List was based on ideas of [tom-select.js](https://github.com/orchidjs/tom-select) With the primary objectives of achieving the highest code optimization, readability, clarity, and ease of extensibility..


### Features

- **Smart Searching / Ranking**<br>Options are efficiently scored and sorted on-the-fly (using plugin [fuzzysort](https://github.com/giomuahe1996/SmartList/blob/main/smList.plugin.fuzzysort.js)).
- **Select &amp; delete multiple tags at once**<br>Clicked tags to select more than one to delete.
- **Remote data loading**<br>For when you have thousands of options and want them provided by the server as the user types.
- **Extensible**<br> [Plugin API] for developing custom features.<br> [Theme API] for developing custom css.
- **Accessible**, **Touch Support**, **Clean API**, ...

## Frame HTML
```html
<select multiple hiden>
    <option value="{id_1}">{name_1}</option>
    <option value="{id_2}">{name_2}</option>
</select>
<div class="sl-container">
    <div class="sl-head">
        <div class="sl-tags">
            <div class="sl-tag"></div>
            <div class="sl-tag"></div>
        </div>
		<div class="sl-control">
			<input class="sl-searchInput" type="input"/>
			<div class="sl-clear"></div>
		</div>
    </div>
    <div class="sl-list">
        <div class="sl-items">
            <div class="sl-item"></div>
            <div class="sl-item"></div>
        </div>
    </div>
</div>
```

## Usage

```html
<script src="~/js/smList.js"></script>
<script src="~/js/smList.plugin.keyboard.js"></script>
<script src="~/js/smlist.plugin.fuzzysort.js"></script>
<script src="~/js/smlist.theme.tailwind.js"></script>

<select class="fruits"
        data-selected='[
          {"id": "banana", "name": "🍌 Banana"},
          {"id": "apple", "name": "🍎 Apple"}
        ]'
        data-items='[
          {"id": "apple", "name": "🍎 Apple"},
          {"id": "banana", "name": "🍌 Banana"},
          {"id": "cherry", "name": "🍒 Cherry"},
          {"id": "option1", "name": "Option1"},
          {"id": "option2", "name": "Option2"},
          {"id": "apple1", "name": "🍎 Apple1"},
          {"id": "banana1", "name": "🍌 Banana1"},
          {"id": "cherry1", "name": "🍒 Cherry1"},
          {"id": "option3", "name": "Option3"},
          {"id": "option4", "name": "Option4"},
          {"id": "apple2", "name": "🍎 Apple2"},
          {"id": "banana2", "name": "🍌 Banana2"},
          {"id": "cherry2", "name": "🍒 Cherry2"},
          {"id": "option5", "name": "Option5"},
          {"id": "option6", "name": "Option6"},
          {"id": "apple3", "name": "🍎 Apple3"},
          {"id": "banana3", "name": "🍌 Banana3"},
          {"id": "cherry3", "name": "🍒 Cherry3"},
          {"id": "option7", "name": "Option7"},
          {"id": "option8", "name": "Option8"}
        ]'></select>

<select class="fruits" data-selected='["banana", "apple"]'>
  <option value="apple">🍎 Apple</option>
  <option value="cherry">🍒 Cherry</option>
  <option value="option1">Option1</option>
  <option value="option2">Option2</option>
  <option value="apple1">🍎 Apple1</option>
  <option value="banana1">🍌 Banana1</option>
  <option value="cherry1">🍒 Cherry1</option>
  <option value="option3">Option3</option>
  <option value="option4">Option4</option>
  <option value="apple2">🍎 Apple2</option>
  <option value="cherry2">🍒 Cherry2</option>
</select>

<select class="fruits" multiple
        data-selected='["banana", "apple"]'
        data-items='[
          {"id": "apple", "name": "🍎 Apple"},
          {"id": "banana", "name": "🍌 Banana"},
          {"id": "cherry", "name": "🍒 Cherry"},
          {"id": "option1", "name": "Option1"},
          {"id": "option2", "name": "Option2"},
          {"id": "apple1", "name": "🍎 Apple1"},
          {"id": "banana1", "name": "🍌 Banana1"},
          {"id": "cherry1", "name": "🍒 Cherry1"},
          {"id": "option3", "name": "Option3"},
          {"id": "option4", "name": "Option4"},
          {"id": "apple2", "name": "🍎 Apple2"},
          {"id": "banana2", "name": "🍌 Banana2"},
          {"id": "cherry2", "name": "🍒 Cherry2"},
          {"id": "option5", "name": "Option5"},
          {"id": "option6", "name": "Option6"},
          {"id": "apple3", "name": "🍎 Apple3"},
          {"id": "banana3", "name": "🍌 Banana3"},
          {"id": "cherry3", "name": "🍒 Cherry3"},
          {"id": "option7", "name": "Option7"},
          {"id": "option8", "name": "Option8"}
        ]'></select>

<script type="text/javascript">
	let widgets = new SmartList(".fruits", {
		"idField": "id",	// default "id"
		"labelField": "name",	// default "label"
		"plugins": ["fuzzySort", "keyboard"],
		"theme": "bootstrap"
    });
</script>
```


## Sponsors
<p>
Many thanks to all our sponsors who help make development possible. <a href="mailto:ducmanhchy@gmail.com">Contact to me</a>
</p>
