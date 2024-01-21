function parseHTML(html)
{
  return new DOMParser().parseFromString(html, 'text/html');
}

function load(url)
{
  return new Promise(function (resolve, reject) {
    fetch(url).then(response => {
      response.text().then(text => {
        resolve(parseHTML(text));
      }, () => reject());
    }, () => reject());
  });
}

function appendTemplatesToDocument(doc)
{
  doc.querySelectorAll('template').forEach(t => {
    document.body.appendChild(t);
  });
}

function arrayToObject(key, arr)
{
  var obj = {};
  key.forEach((k, i) => {
    if(k) obj[k] = arr[i];
  });
  return obj;
}

function tableTo2DArray(table)
{
  return Array.from(table.querySelectorAll('tr'))
    .map(tr => Array.from(tr.querySelectorAll('td')).map(td => {
      td.innerHTML = td.innerHTML.replace(/<br>/ig, '\n');
      return td.textContent;
    }));
}

function getSubmitFormHeader(arr)
{
  return arr[1]; /* After column number */
}

function getSubmitFormData(arr)
{
  return arr.slice(3) /* Column number, Header, Freeze Separator */
    .map(row => arrayToObject(vm.fields, row));
}

var vm;

function runApp()
{
  Vue.component('data-view', {
    template: '#data-view',
    props: {
      fields: {
        type: Array
      },
      data: {
        type: Object
      }
    }
  });

  Vue.component('data-field', {
    template: '#data-field',
    props: {
      data: {
        type: Object,
        default: () => {}
      },
      field: {
        type: String,
        default: () => {}
      }
    }
  });

  vm = new Vue({
    el: '#app',
    template: '#t',
    data: function () {
      return {
        db: [],
        fields: [],
        state: 'NOFILE'
      }
    },
    created: function () {
      if(CONFIG.dataFileName) {
        this.state = 'LOADING';
        load(CONFIG.dataFileName).then(doc => {
          let contentDOM = parseHTML(reader.result)
          let arr = tableTo2DArray(contentDOM.querySelector('table'));
          this.fields = getSubmitFormHeader(arr);
          this.db = getSubmitFormData(arr);
        }).catch(() => { this.state = 'ERROR'; });
      }
    },
    watch: {
      db: function () {
        this.state = 'DONE'
      }
    },
    methods: {
      onUploadByButton(e) {
        loadFile(e.target.files[0])
      }
    }
  });
}

/*
load('template.html')
  .then(appendTemplatesToDocument)
  .then(runApp) */

runApp();

document.addEventListener('drop', e => { e.stopPropagation(); e.preventDefault();
  loadFile(e.dataTransfer.files[0]);
}, false);



function loadFile(file){
  var reader = new FileReader();
  reader.addEventListener('loadend', e => {
    if(reader.readyState === FileReader.DONE) {
      if(vm) {
        let contentDOM = parseHTML(reader.result)
        let arr = tableTo2DArray(contentDOM.querySelector('table'));
        vm.fields = getSubmitFormHeader(arr);
        vm.db = getSubmitFormData(arr);
      }
    }
  });
  reader.readAsText(file, 'UTF-8')
}

document.addEventListener('dragover', e => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}, false);

// vim: et sw=2
