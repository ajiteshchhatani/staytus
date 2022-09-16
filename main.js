const planets_container = document.getElementById('planets_container');

function createStore(initialState, reducer) {
    const state = new Proxy(
        { value: initialState },
        {
            set(obj, prop, value) {
                obj[prop] = value;
                updateUI();
            }
        }
    )

    function getState() {
        return { ...state.value }
    }

    function dispatch(action) {
        const prevState = getState();
        state.value = reducer(prevState, action)
    }

    return {
        getState,
        dispatch
    }
}

const initialState = {
    planets: []
}

function reducer(state, action) {
    switch (action.name) {
        case "PLANETS_FETCHED": {
            return {
                ...state,
                planets: [
                    ...state.planets,
                    action.payload
                ]
            }
        }
        default:
            break;
    }
}

const store = createStore(initialState, reducer)

getPlanets();

function updateUI() {
    const planets_list_item = document.getElementsByClassName('planets_list_items');
    const template = [];
    planets_container.innerHTML = "";
    // To redraw main planet containers if state changes
    if (planets_list_item.length > 0) {
        for (let i = 0; i < planets_list_item.length; i++) {
            planets_list_item[i].remove();
        }
    }
    else {
        for (let i = 0; i < store.getState().planets.length; i++) {

            let filmListItems = ``
            store.getState().planets[i]?.filmDetails?.forEach(film => {
                filmListItems += `<li class="list-none text-text_gray">${film.title}</li>`
            })

            const filmList = `<ul>${filmListItems}</ul>`

            template.push(
                `<div class="planets_list_items w-4/5 my-4 mx-auto rounded-md bg-dark">`,
                    `<div class="p-4">`,
                        `<div class="flex flex-col sm:flex-row">`,
                            `<p class="text-text_yellow">Planet created</p>`,
                            `<p class="text-text_yellow my-2 sm:ml-auto sm:my-0">${new Date(store.getState().planets[i].created).toLocaleDateString('en-GB')}</p>`,
                        `</div>`,
                        `<div class="flex flex-col sm:flex-row mt-2">`,
                            `<div class="flex">`,
                                `<svg xmlns="http://www.w3.org/2000/svg" class="fill-text_yellow" width="24" height="24" viewBox="0 0 320 512"><path d="M32 32C14.3 32 0 46.3 0 64V256 448c0 17.7 14.3 32 32 32H192c70.7 0 128-57.3 128-128c0-46.5-24.8-87.3-62-109.7c18.7-22.3 30-51 30-82.3c0-70.7-57.3-128-128-128H32zM160 224H64V96h96c35.3 0 64 28.7 64 64s-28.7 64-64 64zM64 288h96 32c35.3 0 64 28.7 64 64s-28.7 64-64 64H64V288z"/></svg>`,
                                `<h3 class="w-full mb-4 pl-2 text-white">${store.getState().planets[i].name}</h3>`,
                            `</div>`,
                            `<p class="text-white mb-2 sm:ml-auto sm:mb-0">${store.getState().planets[i].climate}</p>`,
                        `</div>`,
                        `<div>`,
                            `${filmList}`,
                        `</div>`,
                    `</div>`,
                `</div>`
            )
            let htmlString = template.join('');
            planets_container.innerHTML = htmlString
        }
    }
}

async function getPlanets() {
    const baseURL = `https://swapi.dev/api`;
    const planetsList = [];
    for (let i = 1; i < 7; i++) {
        const response = await fetch(`${baseURL}/planets/?page=${i}`);
        let planets = await response.json();
        planetsList.push(...planets.results);   
    }

    const planetsWithAtLeastTwoFilms = planetsList.filter(p => p.films.length >= 2);

    filterPlanets(planetsWithAtLeastTwoFilms);
}

function filterPlanets(planets) {
    const planetListForUI = [];

    planets.map(async (planet) => {
        let starships = 0;
        const planetResidents = [];
        for(let i = 0; i < planet.residents.length; i++) {
            const response = await fetch(planet?.residents[i]);
            const data = await response.json();
            planetResidents.push(data)
        }
        starships = planetResidents.reduce((starships, obj) => {
            return starships + obj.starships.length
        }, starships)

        if(starships >= 5) {
            let filmDetails = []
            for(let i = 0; i < planet.films.length; i++ ) {
                const response = await fetch(planet?.films[i]);
                const data = await response.json();
                filmDetails.push(data);
            }
            planetListForUI.push({...planet, filmDetails})
            store.dispatch({ name: "PLANETS_FETCHED", payload: {...planet, filmDetails} })
        }
    })
}