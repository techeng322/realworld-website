import {consume} from '@layr/component';
import {Routable, route} from '@layr/routable';
import {useMemo, useCallback} from 'react';
import {view, useAsyncCallback, useAsyncMemo} from '@layr/react-integration';
import {jsx, useTheme} from '@emotion/react';
import {Input, Select, Button} from '@emotion-starter/react';
import {Box, ComboBox, LaunchIcon} from '@emotion-kit/react';
import compact from 'lodash/compact';
import {formatDistanceToNowStrict} from 'date-fns';
import numeral from 'numeral';

import type {
  Implementation as BackendImplementation,
  ImplementationCategory,
  FrontendEnvironment
} from '../../../backend/src/components/implementation';
import type {Home} from './home';
import type {Common} from './common';

export const implementationCategories = {
  frontend: {label: 'Frontend'},
  backend: {label: 'Backend'},
  fullstack: {label: 'Fullstack'}
};

export const frontendEnvironments = {
  web: {label: 'Web'},
  mobile: {label: 'Mobile'},
  desktop: {label: 'Desktop'}
};

const popularLanguages = [
  'C',
  'C#',
  'C++',
  'Clojure',
  'ClojureScript',
  'CoffeeScript',
  'Dart',
  'Elixir',
  'Go',
  'Groovy',
  'Java',
  'JavaScript',
  'Kotlin',
  'Objective-C',
  'Perl',
  'PHP',
  'Python',
  'Ruby',
  'Rust',
  'Scala',
  'Swift',
  'TypeScript'
];

const popularLibraries = [
  'Angular',
  'Apollo',
  'Aurelia',
  'Backbone',
  'Dojo',
  'Elm',
  'Ember.js',
  'Express',
  'Feathers',
  'Flux',
  'Gatsby',
  'GraphQL',
  'Hapi',
  'Immer',
  'Ionic',
  'jQuery',
  'Koa',
  'Laravel',
  'LoopBack',
  'Meteor',
  'Micro',
  'MobX',
  'NestJS',
  '.NET',
  'Next.js',
  'NgRx',
  'Nuxt.js',
  'Polymer',
  'Preact',
  'Prisma',
  'React',
  'React Native',
  'Redux',
  'Relay',
  'Restify',
  'Ruby on Rails',
  'RxJS',
  'Sails',
  'Svelte',
  'Vue.js',
  'Vuex'
];

export const getImplementation = (Base: typeof BackendImplementation) => {
  class Implementation extends Routable(Base) {
    ['constructor']!: typeof Implementation;

    @consume() static Home: typeof Home;
    @consume() static Common: typeof Common;

    @route('/implementations/submit') @view() static Submit() {
      const {Home, Common} = this;

      return Common.ensureUser(() => {
        const implementation = useMemo(
          () =>
            this.create(
              {
                repositoryURL: '',
                frontendEnvironment: undefined,
                language: '',
                libraries: ['']
              },
              {attributeSelector: {id: true}}
            ),
          []
        );

        const [handleSubmit] = useAsyncCallback(async () => {
          await implementation.submit();
          this.SubmitCompleted.navigate();
        });

        return (
          <implementation.Form
            title="Submit an Implementation"
            onSubmit={handleSubmit}
            onCancel={async () => {
              Home.Main.navigate();
            }}
          />
        );
      });
    }

    @route('/implementations/submit/completed') @view() static SubmitCompleted() {
      const {Home, Common} = this;

      return Common.ensureUser(() => {
        return (
          <Common.Dialog title={'Thank you!'}>
            <p>Your submission has been recorded. We will review it shortly.</p>
            <Common.ButtonBar>
              <Button
                onClick={() => {
                  Home.Main.navigate();
                }}
                color="primary"
                css={{marginTop: '1rem'}}
              >
                Okay
              </Button>
            </Common.ButtonBar>
          </Common.Dialog>
        );
      });
    }

    @view() Form({
      title,
      onSubmit,
      onApprove,
      onReject,
      onCancel
    }: {
      title: string;
      onSubmit?: () => Promise<any>;
      onApprove?: () => Promise<void>;
      onReject?: () => Promise<void>;
      onCancel: () => Promise<void>;
    }) {
      const {Common} = this.constructor;

      const theme = useTheme();

      const cleanAttributes = useCallback(() => {
        this.repositoryURL = this.repositoryURL.trim();
        this.language = this.language.trim();
        this.libraries = compact(this.libraries.map((library) => library.trim()));
      }, []);

      const [handleSubmit, isSubmitting, submitError] = useAsyncCallback(async () => {
        cleanAttributes();
        await onSubmit!();
      });

      const [handleApprove, isApproving, approveError] = useAsyncCallback(async () => {
        cleanAttributes();
        await onApprove!();
      });

      const [handleReject, isRejecting, rejectError] = useAsyncCallback(async () => {
        await onReject!();
      });

      const [handleCancel, isCanceling, cancelError] = useAsyncCallback(async () => {
        await onCancel();
      });

      const isBusy = isSubmitting || isApproving || isRejecting || isCanceling;
      const error = submitError || approveError || rejectError || cancelError;

      if (isBusy) {
        return <Common.LoadingSpinner />;
      }

      if (this.libraries[this.libraries.length - 1] !== '') {
        this.libraries = [...this.libraries, ''];
      }

      const category = this.getAttribute('category').isSet() ? this.category : '';

      const libraryPlaceholder =
        category === 'frontend'
          ? 'React'
          : category === 'backend'
          ? 'Express'
          : category === 'fullstack'
          ? 'Meteor'
          : '';

      const controlStyle = {marginTop: '1rem', display: 'flex', flexDirection: 'column'} as const;
      const labelStyle = {
        marginBottom: '.5rem',
        color: theme.colors.text.muted,
        lineHeight: theme.lineHeights.small
      };

      return (
        <Common.Dialog title={title}>
          <form
            onSubmit={
              onSubmit
                ? (event) => {
                    event.preventDefault();
                    handleSubmit();
                  }
                : undefined
            }
            autoComplete="off"
          >
            {error && <Common.ErrorMessage error={error} />}

            <div css={controlStyle}>
              <label htmlFor="repositoryURL" css={labelStyle}>
                Repository URL
              </label>
              <div css={{display: 'flex', alignItems: 'center'}}>
                <Input
                  id="repositoryURL"
                  value={this.repositoryURL}
                  onChange={(event) => {
                    this.repositoryURL = event.target.value;
                  }}
                  placeholder="https://github.com/owner/repository"
                  readOnly={!this.isNew()}
                  required
                  autoFocus={this.isNew()}
                  css={{width: '100%'}}
                />
                <OpenURLButton url={this.repositoryURL} css={{marginLeft: '.5rem'}} />
              </div>
            </div>

            <div css={{display: 'flex', flexWrap: 'wrap'}}>
              <div css={{...controlStyle, marginRight: '1rem'}}>
                <label htmlFor="category" css={labelStyle}>
                  Category
                </label>
                <Select
                  id="category"
                  value={category}
                  onChange={(event) => {
                    if (event.target.value !== '') {
                      this.category = event.target.value as ImplementationCategory;
                    } else {
                      this.getAttribute('category').unsetValue();
                    }

                    this.frontendEnvironment = undefined;
                  }}
                  required
                  css={{width: 150}}
                >
                  {this.isNew() && <option value="" />}
                  {Object.entries(implementationCategories).map(([value, {label}]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              {(category === 'frontend' || category === 'fullstack') && (
                <div css={{...controlStyle, marginRight: '1rem'}}>
                  <label htmlFor="frontendEnvironment" css={labelStyle}>
                    Environment
                  </label>
                  <Select
                    id="frontendEnvironment"
                    value={this.frontendEnvironment !== undefined ? this.frontendEnvironment : ''}
                    onChange={(event) => {
                      this.frontendEnvironment =
                        event.target.value !== ''
                          ? (event.target.value as FrontendEnvironment)
                          : undefined;
                    }}
                    required
                    css={{width: 150}}
                  >
                    <option value="" />
                    {Object.entries(frontendEnvironments).map(([value, {label}]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div css={{...controlStyle}}>
                <label htmlFor="language" css={labelStyle}>
                  Language
                </label>
                <ComboBox
                  id="language"
                  items={popularLanguages}
                  initialValue={this.language}
                  onValueChange={(value) => {
                    this.language = value;
                  }}
                  required
                  placeholder="JavaScript"
                  css={{width: 200}}
                />
              </div>
            </div>

            <div css={{...controlStyle, marginBottom: '-.5rem'}}>
              <label css={labelStyle}>Libraries/Frameworks</label>
              {this.libraries.map((_, index) => (
                <ComboBox
                  key={index}
                  items={popularLibraries}
                  initialValue={this.libraries[index]}
                  onValueChange={(value) => {
                    this.libraries[index] = value;
                  }}
                  placeholder={index === 0 ? libraryPlaceholder : 'One more?'}
                  css={{width: 200, marginBottom: '.5rem'}}
                />
              ))}
            </div>

            <Common.ButtonBar>
              {onSubmit && (
                <Button type="submit" color="primary" css={{margin: '1rem 1rem 0 0'}}>
                  Submit
                </Button>
              )}

              {onApprove && (
                <Button
                  onClick={(event) => {
                    event.preventDefault();
                    handleApprove();
                  }}
                  color="positive"
                  css={{margin: '1rem 1rem 0 0'}}
                >
                  Approve
                </Button>
              )}

              {onReject && (
                <Button
                  onClick={(event) => {
                    event.preventDefault();
                    handleReject();
                  }}
                  color="negative"
                  css={{margin: '1rem 1rem 0 0'}}
                >
                  Reject
                </Button>
              )}

              <Button
                onClick={(event) => {
                  event.preventDefault();
                  handleCancel();
                }}
                variant="outline"
                css={{marginTop: '1rem'}}
              >
                Cancel
              </Button>
            </Common.ButtonBar>
          </form>
        </Common.Dialog>
      );
    }

    @route('/implementations/review') @view() static ReviewList() {
      const {Common} = this;

      return Common.ensureAdmin(() => {
        const theme = useTheme();

        const [implementations] = useAsyncMemo(async () => {
          return await this.findSubmissionsToReview();
        });

        if (implementations === undefined) {
          return <Common.LoadingSpinner />;
        }

        const headerStyle = {
          display: 'flex',
          paddingBottom: '.5rem',
          fontSize: '75%',
          color: theme.colors.text.muted,
          fontWeight: theme.fontWeights.bold,
          textTransform: 'uppercase',
          letterSpacing: '.5px'
        } as const;

        const rowStyle = {
          'display': 'flex',
          'marginBottom': '-1px',
          'padding': '.5rem 0',
          'borderTop': `1px solid ${theme.colors.border.normal}`,
          'borderBottom': `1px solid ${theme.colors.border.normal}`,
          'cursor': 'pointer',
          ':hover': {
            backgroundColor: theme.colors.background.highlighted
          }
        } as const;

        const columnStyles = [
          {width: '275px'},
          {width: '100px'},
          {width: '125px'},
          {width: '125px'},
          {flex: 1},
          {paddingRight: 0, width: '125px'}
        ] as const;

        const cellStyle = {
          paddingRight: '1rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        } as const;

        return (
          <div css={{marginTop: '2rem'}}>
            <h3>Review Submissions</h3>

            {implementations.length > 0 && (
              <div css={{marginTop: '2rem'}}>
                <div css={headerStyle}>
                  <div css={{...cellStyle, ...columnStyles[0]}}>Repository</div>
                  <div css={{...cellStyle, ...columnStyles[1]}}>Category</div>
                  <div css={{...cellStyle, ...columnStyles[2]}}>Environment</div>
                  <div css={{...cellStyle, ...columnStyles[3]}}>Language</div>
                  <div css={{...cellStyle, ...columnStyles[4]}}>Libraries/Frameworks</div>
                  <div css={{...cellStyle, ...columnStyles[5]}}>Submitted</div>
                </div>

                {implementations.map((implementation) => {
                  return (
                    <div
                      key={implementation.id}
                      onClick={() => {
                        this.Review.navigate(implementation);
                      }}
                      css={rowStyle}
                    >
                      <div css={{...cellStyle, ...columnStyles[0]}}>
                        {implementation.formatRepositoryURL()}
                      </div>
                      <div css={{...cellStyle, ...columnStyles[1]}}>
                        {(implementationCategories as any)[implementation.category].label}
                      </div>
                      <div css={{...cellStyle, ...columnStyles[2]}}>
                        {implementation.frontendEnvironment !== undefined
                          ? (frontendEnvironments as any)[implementation.frontendEnvironment].label
                          : ''}
                      </div>
                      <div css={{...cellStyle, ...columnStyles[3]}}>{implementation.language}</div>
                      <div css={{...cellStyle, ...columnStyles[4]}}>
                        {implementation.formatLibraries()}
                      </div>
                      <div css={{...cellStyle, ...columnStyles[5]}}>
                        {formatDistanceToNowStrict(implementation.createdAt, {addSuffix: true})}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {implementations.length === 0 && (
              <Box css={{marginTop: '2rem', padding: '1rem'}}>
                There are no submissions to review.
              </Box>
            )}
          </div>
        );
      });
    }

    @route('/implementations/:id/review') @view() static Review({id}: {id: string}) {
      const {Common} = this;

      return Common.ensureAdmin(() => {
        const [implementation, , loadingError] = useAsyncMemo(async () => {
          return await this.reviewSubmission(id);
        }, [id]);

        if (loadingError !== undefined) {
          return <Common.ErrorMessage error={loadingError} />;
        }

        if (implementation === undefined) {
          return <Common.LoadingSpinner />;
        }

        return (
          <implementation.Form
            title="Review a Submission"
            onApprove={async () => {
              await implementation.approveSubmission();
              this.ReviewList.navigate();
            }}
            onReject={async () => {
              await implementation.rejectSubmission();
              this.ReviewList.navigate();
            }}
            onCancel={async () => {
              await implementation.cancelSubmissionReview();
              this.ReviewList.navigate();
            }}
          />
        );
      });
    }

    formatRepositoryURL() {
      return this.repositoryURL.slice('https://github.com/'.length);
    }

    formatFrontendEnvironment() {
      return this.frontendEnvironment !== undefined
        ? frontendEnvironments[this.frontendEnvironment].label
        : '';
    }

    formatLibraries() {
      return this.libraries.join(' + ');
    }

    formatNumberOfStars() {
      return numeral(this.numberOfStars).format('0.[0]a');
    }
  }

  return Implementation;
};

export declare const Implementation: ReturnType<typeof getImplementation>;

export type Implementation = InstanceType<typeof Implementation>;

function OpenURLButton({url, className}: {url?: string; className?: string}) {
  const theme = useTheme();

  return (
    <LaunchIcon
      onClick={
        url
          ? () => {
              window.open(url, 'realworld-repository-review');
            }
          : undefined
      }
      size={24}
      css={{
        'color': url ? theme.colors.text.muted : theme.colors.border.normal,
        'cursor': url ? 'pointer' : undefined,
        ':hover': url ? {color: theme.colors.text.normal} : undefined
      }}
      className={className}
    />
  );
}
