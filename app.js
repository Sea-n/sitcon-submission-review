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
      },
      changeTheme() {
        let preferredTheme = localStorage.getItem('theme');
        setTheme(preferredTheme === 'dark' ? 'light' : 'dark');
      },
      scrollToTop() {
        var scrollStep = -window.scrollY / (600 / 15);
        var scrollInterval = setInterval(function() {
          if (window.scrollY !== 0) {
            window.scrollBy(0, scrollStep);
          } else {
            clearInterval(scrollInterval);
          }
        }, 15);
      },
      returnToHome() {
        location.reload();
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
  reader.readAsText(file, 'UTF-8');
  btnReturnToHome.style.pointerEvents = 'all';
  btnReturnToHome.style.opacity = 1; // The return home button only appears after loading the file
}

document.addEventListener('dragover', e => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}, false);

// vim: et sw=2

// Set the theme
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.body.classList.toggle('dark-mode', theme === 'dark');
  switchThemeIcon(theme);
}

// Switch the theme switch button icon
function switchThemeIcon(theme) {
  const btnSwitchTheme = document.getElementById('btnSwitchTheme');
  const iconSpan = btnSwitchTheme.querySelector('.material-symbols-outlined');
  if (theme === 'dark') {
    iconSpan.textContent = 'light_mode';
  } else {
    iconSpan.textContent = 'dark_mode';
  }
}

// Listen to user-preferred theme
window.addEventListener('load', (event) => {
  let preferredTheme = localStorage.getItem('theme');
  let darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (preferredTheme == null) {
    preferredTheme = darkQuery.matches ? 'dark' : 'light';
  }
  darkQuery.addEventListener('change', function (e) {
    setTheme(e.matches ? 'dark' : 'light');
  });
  setTheme(preferredTheme);
});

// smooth scroll-to-top button
document.addEventListener('DOMContentLoaded', function() {
  var btnScrollToTop = document.getElementById('btnScrollToTop');

  // Show or hide the button based on the scroll position
  window.addEventListener('scroll', function() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      btnScrollToTop.style.pointerEvents = 'all';
      btnScrollToTop.style.opacity = 1;
      btnScrollToTop.style.transform = 'translateY(0px)';
      btnSwitchTheme.style.transform = 'translateY(0px)';
      btnReturnToHome.style.transform = 'translateY(0px)';
    } else {
      btnScrollToTop.style.opacity = 0;
      btnScrollToTop.style.pointerEvents = 'none';
      btnScrollToTop.style.transform = 'translateY(55px)';
      btnReturnToHome.style.transform = 'translateY(55px)';
      btnSwitchTheme.style.transform = 'translateY(55px)';
    }
  });
});