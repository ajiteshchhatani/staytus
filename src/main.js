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
            store.getState().planets[i].filmsForDisplay.forEach(film => {
                filmListItems += `<li class="list-none text-text_gray">${film.title}</li>`
            })

            const filmList = `<ul>${filmListItems}</ul>`

            template.push(
                `<div class="planets_list_items w-4/5 my-4 mx-auto rounded-md bg-dark">`,
                    `<div class="p-4">`,
                        `<div class="flex">`,
                            `<p class="text-text_yellow">Planet created</p>`,
                            `<p class="text-text_yellow ml-auto">${new Date(store.getState().planets[i].created).toLocaleDateString('en-GB')}</p>`,
                        `</div>`,
                        `<div class="flex mt-2">`,
                            `<div>`,
                                `<div class="flex">`,
                                    `<svg xmlns="http://www.w3.org/2000/svg" class="fill-text_yellow" width="24" height="24" viewBox="0 0 320 512"><path d="M32 32C14.3 32 0 46.3 0 64V256 448c0 17.7 14.3 32 32 32H192c70.7 0 128-57.3 128-128c0-46.5-24.8-87.3-62-109.7c18.7-22.3 30-51 30-82.3c0-70.7-57.3-128-128-128H32zM160 224H64V96h96c35.3 0 64 28.7 64 64s-28.7 64-64 64zM64 288h96 32c35.3 0 64 28.7 64 64s-28.7 64-64 64H64V288z"/></svg>`,
                                    `<h3 class="w-full mb-4 pl-2 text-white">${store.getState().planets[i].name}</h3>`,
                                `</div>`,
                                `${filmList}`,
                            `</div>`,
                            `<p class="text-white ml-auto">${store.getState().planets[i].climate}</p>`,
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
    const baseURL = `https://swapi.dev/api`
    let planetsPromises = [];
    let planets = await getDataForPlanets()

    // initial function to make API calls for all planets page wise
    async function getDataForPlanets() {
        for (let i = 1; i < 7; i++) {
            planetsPromises.push(fetch(`${baseURL}/planets/?page=${i}`).then((res) => res.json()).then((data) => data.results))
        }
        // wait for all planet data promises to resolve for data from all pages
        return Promise.all(planetsPromises).then(res => {
            const planetsData = []
            for (r of res) {
                r.map(p => planetsData.push(p))
            }
            return planetsData
        })
    }

    // Filter planets list for planets that have appeared in two films
    const planetsWithAtLeastTwoFilms = planets.filter(p => p.films.length >= 2);

    await getFilteredPlanetList()

    // function to further filter planet list based on total starship of all residents
    async function getFilteredPlanetList() {
        planetsWithAtLeastTwoFilms.map((planet) => {
            const residentsOnPlanet = planet.residents;
            const promises = [];
            let starShips = 0;
            // retrieve data via promises for all residents of each planet
            for (let i = 0; i < residentsOnPlanet.length; i++) {
                promises.push(fetch(residentsOnPlanet[i]).then(res => res.json()).then(data => data))
            }
            // wait for all promises to resolve before checking if starships > 5
            Promise.all(promises).then(res => {
                starShips = res.map(r => r?.starships.length).reduce((starShips, nextValue) => starShips + nextValue)
                if (starShips >= 5) {

                    const filmsPromises = []
                    // retrive data via promises for all films for planets whose resident have > 5 starships
                    planet.films.forEach(film => {
                        filmsPromises.push(fetch(film).then(res => res.json()).then(data => data))
                    });

                    Promise.all(filmsPromises).then(res => {
                        // add an extra array property that has all film data for the planet received via API calls above
                        const planetsWithFilmNames = {
                            ...planet,
                            filmsForDisplay: res
                        }
                        addPlanetToFinalList(planetsWithFilmNames)
                    })
                }
            })
        })
    }

    function addPlanetToFinalList(planet) {
        // once all planets are filtered according to all conditions action is dispatch to update state
        store.dispatch({ name: "PLANETS_FETCHED", payload: planet })
    }
}