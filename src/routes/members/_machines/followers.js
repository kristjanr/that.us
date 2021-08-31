import { createMachine, assign } from 'xstate';

import { log } from '$utils/error';
import createPagingConfig from '$machines/paging';
import memberQueryApi from '$dataSources/api.that.tech/members/queries';

function createServices() {
	const { queryFollowers, queryNextFollowers } = memberQueryApi();

	return {
		guards: {
			hasMore: (_, event) => event.data !== null
		},

		services: {
			load: (context) => queryFollowers(context.meta.profileSlug),
			loadNext: (context) => queryNextFollowers(context.meta.profileSlug, context.cursor)
		},

		actions: {
			logError: (context, event) =>
				log({
					error: 'members followers state machine ended in the error state.',
					extra: { context, event },
					tags: { stateMachine: 'members' }
				}),

			loadSuccess: assign({
				items: (_, { data: { followers } }) => followers.profiles,
				cursor: (_, { data: { followers } }) => followers.cursor
			}),

			loadNextSuccess: assign({ items: (_, event) => event.data }),

			loadedAllSuccess: assign({
				items: () => [],
				cursor: () => undefined
			})
		}
	};
}

function create(meta) {
	const services = createServices();
	return createMachine({ ...createPagingConfig(meta) }, { ...services });
}

export default create;
